
//const Question = {
//  template: '<div>Question {{ $route.params.question }}</div>'
//}

const router = new VueRouter({
  base: '/RelationshipAdvisor/',
  //mode: 'history',
  routes: [
    // dynamic segments start with a colon
    { path: '/:question' }
  ]
})

// mode: 'history' - Apache -> Nginx

// https://router.vuejs.org/en/essentials/dynamic-matching.html
// https://router.vuejs.org/en/advanced/data-fetching.html

// https://github.com/ibm-watson-data-lab/shopping-list-vuejs-pouchdb
// https://pouchdb.com/2016/04/28/prebuilt-databases-with-pouchdb.html

// https://vuejsfeed.com/blog/build-a-reusable-autocomplete-component-with-vue-2-1
// http://taha-sh.com/blog/building-an-awesome-reusable-autocomplete-input-component-in-vue-21-part-one
// http://taha-sh.com/blog/building-an-awesome-reusable-autocomplete-input-component-in-vue-21-part-two

// this is the Vue.js app
new Vue({
    el: '#app',
    router,
    watch:{
      '$route.params.question': function(newVal){
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
        categories.categoryNameList = [];
        categories.optionToNameMap = new Object();
        for(var categoryKey in this.categoriesSource) {
          categories.categoryNameList.push(categoryKey);

          var category = new Object();
          category.doctype = 'category';
          category.categoryName = categoryKey;
          category.optionList = this.categoriesSource[categoryKey];
          this.$pouchdbRefs.relationshipadvisor.put('category', category);

          for(var categoryValueIndex in this.categoriesSource[categoryKey]) {
            categories.optionToNameMap[this.categoriesSource[categoryKey][categoryValueIndex]] = categoryKey;
          }
        }
        this.$pouchdbRefs.relationshipadvisor.put('categories', categories);
      },
      // import answers from js file to PouchDB
      parseAnswers() {
        for(var answerIndex in this.answersSource) {
          var answer = this.answersSource[answerIndex];
          answer.categoryNameList = [];
          for(var key in answer) {
            if(key != 'answer' && key != 'categoryNameList' && key != 'doctype') {
              answer.categoryNameList.push(key);
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

        if(!this.question){
          return;
        }
        
        var questionCategories = new Object();
        while(this.question.length > 0) {
          for(var categoryOption in categories.optionToNameMap) {
            if(this.question.startsWith(categoryOption)) {
              questionCategories[categories.optionToNameMap[categoryOption]] = categoryOption;
              if(this.question.length > categoryOption.length) {
                this.question = this.question.substring(categoryOption.length + 1);
              }
              if(this.question.length == categoryOption.length) {
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
            if(!answer.categoryNameList.includes(category)) {
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
          for(var categoryIndex in answer.categoryNameList) {
            var categoryName = answer.categoryNameList[categoryIndex];
            if(!questionCategories.hasOwnProperty(categoryName)) {
              found = false;
              break;
            }
            //var answerCategories = answer[category];
            if(!answer[categoryName].includes(questionCategories[categoryName])) {
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
      // TODO:: alternative to: this.$forceUpdate(); - this.$nextTick(() => {})
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
            this.$set(this.categoriesList, category.categoryName, category);
            //category['isAvailable'] = true;
            this.$set(this.categoriesList[category.categoryName], 'isAvailable', true);
            //category['selectedOption'] = category.optionList[0];
            //this.$set(this.categoriesList[category.categoryName], 'selectedOption', category.optionList[0]);
            this.$set(this.categoriesList[category.categoryName], 'selectedOption', null);
            this.$set(this.categoriesList[category.categoryName], 'optionMap', Object.create(null));
            for(var idx in category.optionList){
              //category.optionList[idx] = { optionName:category.optionList[idx], isAvailable:true };
              //this.$set(this.categoriesList[category.categoryName].optionList, idx, { optionName:category.optionList[idx], isAvailable:true });
              this.$set(this.categoriesList[category.categoryName].optionMap, category.optionList[idx], { optionName:category.optionList[idx], isAvailable:true });
            }
          }
        }
      },
      resetAvailable(){
        // set all to "available:false"
        for(var categoryIdx in this.categoriesList){
          var category = this.categoriesList[categoryIdx];
          category.isAvailable = false;
          //for(var optionIdx in category.list){
          //  category.list[optionIdx].isAvailable = false;
          //}
          for(var optionIdx in category.optionMap){
            category.optionMap[optionIdx].isAvailable = false;
          }
        }
      },
      // TODO:: fix includes() bug - string "fe-male" includes "male"
      updateSelectList(){
        // new list of answers - include answers that contain selected categories and seleceted category values
        var remainingAnswerList = [];
        for(var answerIdx in this.relationshipadvisor.answer){
          var answer = this.relationshipadvisor.answer[answerIdx];
          // answer remains if it contains all selected categories and also contains the selected option in the category
          var include = true;
          for(var idx in this.categoriesList){
            var category = this.categoriesList[idx];
            if(category.selectedOption != null){
              if(!answer.categoryNameList.includes(category.categoryName)){
                include = false;
                break;
              }
              if(!answer[category.categoryName].includes(category.selectedOption)){
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
          // TODO:: write all selected options to form the question
          this.question = "";
          //return;
        }
        this.resetAvailable();
        // set "available:true" to category values that are included in any answer
        // set "available:true" to category if any of its values has "available:true"
        for(var remainingAnswerIdx in remainingAnswerList){
          var remainingAnswer = remainingAnswerList[remainingAnswerIdx];
          for(var categoryIdx in remainingAnswer.categoryNameList){
            var categoryName = remainingAnswer.categoryNameList[categoryIdx];
            //this.categoriesList[categoryIdx].isAvailable = true;
            this.categoriesList[categoryName].isAvailable = true;

            var option = "";
            if(Array.isArray(remainingAnswer[categoryName])){
              for(var optionIdx in remainingAnswer[categoryName]){
                option = remainingAnswer[categoryName][optionIdx];
                //this.categoriesList[categoryIdx][optionIdx].isAvailable = true;
                this.categoriesList[categoryName].optionMap[option].isAvailable = true;
              }
            }
            else{
              option = remainingAnswer[categoryName];
              this.categoriesList[categoryName].optionMap[option].isAvailable = true;
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