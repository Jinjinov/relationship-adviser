
const Question = {
  template: '<div>Question {{ $route.params.question }}</div>'
}

const router = new VueRouter({
  base: '/RelationshipAdvisor/',
  //mode: 'history',
  routes: [
    // dynamic segments start with a colon
    { path: '/:question' }
  ]
})

// this is the Vue.js app
new Vue({
    el: '#app',
    router,
    watch:{
      '$route.params': function (newVal, oldVal){
        //var found = false;
      },
      '$route.params.question': function(newVal, oldVal){
        this.question = newVal;
        this.parseQuestion();
      }
    },
    //-------------------------------------------------------------------------
    // data
    //-------------------------------------------------------------------------
    data: {
      path: window.location.pathname,
      answer: 'Relationship Advisor',
      question: 'single male with one male friend with no female friends shy hard to talk with girls talk to a girl',
      // answers.js
      answersSource: answers,
      // categories.js
      categoriesSource: categories,
      // vue guide:
      selected: 'A',
      options: [
        { text: 'One', value: 'A' },
        { text: 'Two', value: 'B' },
        { text: 'Three', value: 'C' }
      ],
      // list of lists:
      selectList: [
        {
          selected: 'A',
          options: [
            { text: 'One', value: 'A' },
            { text: 'Two', value: 'B' },
            { text: 'Three', value: 'C' }
          ]
        },
        {
          selected: 'A',
          options: [
            { text: 'One', value: 'A' },
            { text: 'Two', value: 'B' },
            { text: 'Three', value: 'C' }
          ]
        }
      ],
      categoriesList: null
    },
    //-------------------------------------------------------------------------
    // pouchdb
    //-------------------------------------------------------------------------
    pouchdb: {
      relationshipadvisor: {
        localDB: "relationshipadvisor",
        remoteURL: "http://127.0.0.1:5984/relationshipadvisor"
      }
    },
    //-------------------------------------------------------------------------
    // computed
    //-------------------------------------------------------------------------
    computed: {
      categoriesMap() {
        return this.relationshipadvisor.categories;
      },
      categories() {
        return this.relationshipadvisor.category;
      },
      answers() {
        return this.relationshipadvisor.answer;
      },
      categoryKeys() {
        var categoriesMap = this.relationshipadvisor.categories;
        if(categoriesMap){
          var value = categoriesMap[Object.keys(categoriesMap)[0]];
          return value.categories;
        }
        /*
        var keys = [];
        for(var category in this.relationshipadvisor.categories) {
          for(var key in this.relationshipadvisor.categories[category]) {
            if(key != '_id' && key != '_rev' && key != 'doctype') {
              keys.push(key);
            }
          }
        }
        return keys;
        /**/
      },
      categoryValues() {
        var categoriesMap = this.relationshipadvisor.categories;
        if(categoriesMap){
          var value = categoriesMap[Object.keys(categoriesMap)[0]];
          return value.map;
        }
        /*
        var values = [];
        for(var category in this.relationshipadvisor.categories) {
          for(var key in this.relationshipadvisor.categories[category]) {
            if(key != '_id' && key != '_rev' && key != 'doctype') {
              for(var value in this.relationshipadvisor.categories[category][key]) {
                values.push(this.relationshipadvisor.categories[category][key][value]);
              }
            }
          }
        }
        return values;
        /**/
      }
    },
    //-------------------------------------------------------------------------
    // methods
    //-------------------------------------------------------------------------
    methods: {
      // import categories from js file to PouchDB
      parseCategories() {
        var categories = new Object();
        categories.doctype = 'categories';
        categories.categories = [];
        categories.map = new Object();
        for(var categoryKey in this.categoriesSource) {
          categories.categories.push(categoryKey);

          var category = new Object();
          category.doctype = 'category';
          category.category = categoryKey;
          category.list = this.categoriesSource[categoryKey];
          this.$pouchdbRefs.relationshipadvisor.put('category', category);

          for(var categoryValueIndex in this.categoriesSource[categoryKey]) {
            categories.map[this.categoriesSource[categoryKey][categoryValueIndex]] = categoryKey;
          }
        }
        this.$pouchdbRefs.relationshipadvisor.put('categories', categories);
      },
      // import answers from js file to PouchDB
      parseAnswers() {
        for(var answerIndex in this.answersSource) {
          var answer = this.answersSource[answerIndex];
          answer.categories = [];
          for(var key in answer) {
            if(key != 'answer' && key != 'categories' && key != 'doctype') {
              answer.categories.push(key);
            }
          }
          answer.doctype = 'answer';
          this.$pouchdbRefs.relationshipadvisor.put('answer', answer);
        }
      },
      // parse URL
      parseQuestion() {
        var categoriesMap = this.relationshipadvisor.categories;
        var answerMap = this.relationshipadvisor.answer;
        if(!categoriesMap || !answerMap){
          return;
        }
        var keys = Object.keys(categoriesMap);
        if(keys.length != 1) {
          alert("there must be exactly 1 Categories object")
        }
        var firstKey = keys[0];
        var categories = categoriesMap[firstKey];
        //var categories = categoriesMap[Object.keys(categoriesMap)[0]];

        var questionCategories = new Object();
        while(this.question.length > 0) {
          for(var categoryValue in categories.map) {
            if(this.question.startsWith(categoryValue)) {
              questionCategories[categories.map[categoryValue]] = categoryValue;
              if(this.question.length > categoryValue.length) {
                this.question = this.question.substring(categoryValue.length + 1);
              }
              if(this.question.length == categoryValue.length) {
                this.question = '';
              }
              break;
            }
          }
        }

        var found = true;
        for(var answerKey in answerMap) {
          var answer = answerMap[answerKey];
          found = true;

          /*
          // is there an answer that contains all parts of the question
          for(var category in questionCategories) {
            if(!answer.categories.includes(category)) {
              found = false;
              break;
            }
            if(!answer[category].includes(questionCategories[category])) {
              found = false;
              break;
            }
          }
          /**/

          // is the question contained in all parts of any answer
          for(var categoryIndex in answer.categories) {
            var category = answer.categories[categoryIndex];
            if(!questionCategories.hasOwnProperty(category)) {
              found = false;
              break;
            }
            //var answerCategories = answer[category];
            if(!answer[category].includes(questionCategories[category])) {
              found = false;
              break;
            }
          }

          if(found) {
            this.answer = answer.answer;
            break;
          }
        }
        if(!found) {
          this.answer = "No answer found!";
        }
      },
      // TODO::
      // - alternative to: this.$forceUpdate();
      prepareSelectList(){
        /*
        if(this.categoriesList == null){
          var temp = this.relationshipadvisor.category;
          if(temp){
            var stringi = JSON.stringify(temp);
            this.categoriesList = JSON.parse(stringi);
          }
        }
        /**/
        if(this.categoriesList == null && this.relationshipadvisor.category){
          this.categoriesList = {};
          for(var categoryKey in this.relationshipadvisor.category){
            var category = this.relationshipadvisor.category[categoryKey];
            this.$set(this.categoriesList, category.category, category);
            //category['isAvailable'] = true;
            this.$set(this.categoriesList[category.category], 'isAvailable', true);
            //category['selected'] = category.list[0];
            //this.$set(this.categoriesList[category.category], 'selected', category.list[0]);
            this.$set(this.categoriesList[category.category], 'selected', null);
            this.$set(this.categoriesList[category.category], 'options', Object.create(null));
            for(var idx in category.list){
              //category.list[idx] = { option:category.list[idx], isAvailable:true };
              //this.$set(this.categoriesList[category.category].list, idx, { option:category.list[idx], isAvailable:true });
              this.$set(this.categoriesList[category.category].options, category.list[idx], { option:category.list[idx], isAvailable:true });
            }
          }
        }
      },
      // TODO::
      // fix includes() bug - string "fe-male" includes "male"
      updateSelectList(){
        // new list of answers - include answers that contain selected categories and seleceted category values
        var remainingAnswerList = [];
        for(var answerIdx in this.relationshipadvisor.answer){
          var answer = this.relationshipadvisor.answer[answerIdx];
          // answer remains if it contains all selected categories and also contains the selected option in the category
          var include = true;
          for(var idx in this.categoriesList){
            var category = this.categoriesList[idx];
            if(category.selected != null){
              if(!answer.categories.includes(category.category)){
                include = false;
                break;
              }
              if(!answer[category.category].includes(category.selected)){
                include = false;
                break;
              }
            }
          }
          if(include){
            remainingAnswerList.push(answer);
          }
        }
        if(remainingAnswerList.length == 1){
          this.answer = remainingAnswerList[0].answer;
          //return;
        }
        // set all to "available:false"
        for(var categoryIdx in this.categoriesList){
          var category = this.categoriesList[categoryIdx];
          category.isAvailable = false;
          //for(var optionIdx in category.list){
          //  category.list[optionIdx].isAvailable = false;
          //}
          for(var optionIdx in category.options){
            category.options[optionIdx].isAvailable = false;
          }
        }
        // set "available:true" to category values that are included in any answer
        // set "available:true" to category if any of its values has "available:true"
        for(var answerIdx in remainingAnswerList){
          var answer = remainingAnswerList[answerIdx];
          for(var categoryIdx in answer.categories){
            var category = answer.categories[categoryIdx];
            //this.categoriesList[categoryIdx].isAvailable = true;
            this.categoriesList[category].isAvailable = true;

            if(Array.isArray(answer[category])){
              for(var optionIdx in answer[category]){
                var option = answer[category][optionIdx];
                //this.categoriesList[categoryIdx][optionIdx].isAvailable = true;
                this.categoriesList[category].options[option].isAvailable = true;
              }
            }
            else{
              var option = answer[category];
              this.categoriesList[category].options[option].isAvailable = true;
            }
          }
        }
      }
    },
    beforeCreate(){
      //var found = false; // #1 , vuepouch -> #2
    },
    created(){
      //var found = false; // #3
    },
    beforeMount(){
      //var found = false; // #4 , computed -> #5
    },
    mounted(){ // template parsed
      //var found = false; // #6 , vuepouch -> #7 initDB - then

      if(this.categoriesList == null){
        this.$forceUpdate();
      }
    },
    beforeUpdate(){
      //var found = false; // #8

      this.prepareSelectList();
    },
    updated(){ // v-for resolved
      //var found = false; // #9
    }
  });