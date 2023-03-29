
function run() {

  const questions = getQuestions(); // from the tools file

  const formMetadataSheetName = 'form collection: Mon, 26 Dec 2022 16:33:20 GMT';

  const formsMetadata = readFormsMetadata(formMetadataSheetName);

  const dataS = { perQuestion: [], perPerson: [], perCategory:[] };

  readResponses(formsMetadata, dataS, questions);

  exportToSheets(dataS);

  Logger.log('Done running!');


  // const dataStructure = {
  //   perQuestion = [ // across all people
  //     {
  //       question: 'question 1',
  //       marks: [4,5,7,8,3],
  //       average: [6.6],
  //       median: [5],
  //       standardDev:6
  //     }
  //   ],
    //   perCategory = [ // across all people
  //     {
  //       category: 'cat 1',
  //       marks: [4,5,7,8,3],
  //       average: [6.6],
  //       median: [5],
  //       standardDev:6
  //     }
  //   ],
  //   perPerson = [
  //   {
  //     name: 'baruch',
    //         reviewers: ['person1', 'person2','3','4']

  //     reviews: [
  //       {
  //         questions: 'question1',
  //         category: 'category1',
  //         selfMark: 7,
  //         peerMarks: [5,3,5,6],
  //       }
  //     ]
  //   },]
  // }



}

function exportToSheets(data) {
  Logger.log('exporting results');
  const time = (new Date());
  const label = time.toLocaleDateString() + ' ' + time.toLocaleTimeString();

// insert people's results
 const peopleSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('people results: ' + label);

  Logger.log('exporting people results');
data.perPerson.forEach(p => {
  p.reviews.forEach(review => {
  let row;
  let answers;
  if (review.type === 'grades') {
    answers = review.peerMarks.join();
  } else {
    answers = review.openAnswers.join(' ; ');
  }
  let categoryCrossSiteMarks = data.perCategory.find(c=>c.category === review.category);
  if (!categoryCrossSiteMarks) {
    categoryCrossSiteMarks= {marks:[]};
  }
  let questionCrossSiteMarks = data.perQuestion.find(c=>c.question === review.question);
  if (!questionCrossSiteMarks) {
    questionCrossSiteMarks= {marks:[]};
  }
if (answers && answers.length > 0){
  row = [p.name,p.responders.join(), review.question, review.category,review.selfMark,answers, categoryCrossSiteMarks.marks.join(), questionCrossSiteMarks.marks.join() ];
  const nextRow = peopleSheet.getLastRow()+1; // get next row
  peopleSheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
  }
  else{
    Logger.log('No feedback given for: ' + p.name + ' for question: ' + review.question );
  }
  })

})
  Logger.log('exporting category results');

  // insert category results
  const categorySheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('category results: ' + label);

data.perCategory.forEach(cat => {
  const row = [cat.category, cat.marks.join() ];
  const nextRow = categorySheet.getLastRow()+1; // get next row
  categorySheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
})

  Logger.log('exporting questions results');

// insert question results
 const questionsSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('questions results: ' + label);

data.perQuestion.forEach(q => {
  const row = [q.category,q.question, q.marks.join() ];
  const nextRow = questionsSheet.getLastRow()+1; // get next row
  questionsSheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
})


}

function readResponses(formsMetadata, dataS, questions) {
  formsMetadata.map(formData => {

    Logger.log(`examining response by ${formData.name}`);
    const responder = formData.name;
    // Open each form by its formID ID and log the responses to each question.
    const form = FormApp.openById(formData.formId);
    const formResponses = form.getResponses();

    if (formResponses.length < 1) {
      Logger.log(`${formData.name} did not reply yet, skipping`);
      return;
    }
    if (formResponses.length > 1) {
      Logger.log(`number of responses was bigger than 1??? ${formResponses.length}, we only allow one reply per person. skipping`);
      return;
    }

    formResponses[0].getItemResponses().map(itemResponse => {
      const item = itemResponse.getItem();
      // Logger.log('item type: ' + item.getType());
      // Logger.log(item.getType().name());

      let question;
      let responseAbout;
      let type = 'grades';
      const response = itemResponse.getResponse();

      if (item.getType().name() === 'GRID') {
        const gridItem = item.asGridItem();
        question = itemResponse.getItem().getTitle();
        responseAbout = gridItem.getRows();
        if (responseAbout.length !== response.length) {
          Logger.log('shouldnt happen');
        }
      } else if (item.getType().name() === 'PARAGRAPH_TEXT') {
        question = itemResponse.getItem().getHelpText();
        responseAbout = itemResponse.getItem().getTitle();
        type = 'open';
      }
      else {
        Logger.log('unexpected question type');
        return;
      }
      //responses.push({ responder, responseAbout, question, response });
      const category = getCategoryForQuestion(questions,question);
      if (!category) {
        Logger.log('could not find category for question');
      }
      addRespose(dataS, { responder, responseAbout, question, response, type, category });
      addQuestionStatistics(dataS, question, response, type,category);
      // Logger.log('question was: ' + question);
      // Logger.log('responses about: ' + responseAbout);
      // Logger.log('response: ' + response);
    })
  })
  return '';

}
function addQuestionStatistics(dataS,question, response, type, category) {
  if (type === 'open') {
    return;
  }

  const formattedResponse = response.map(x=>Number(x)).filter(x=>isNumber(x) && x !== 0);
  if (formattedResponse.length < 1) {
    return;
  }
  // question stats:
  let q = dataS.perQuestion.find(q=>q.question === question) 
  if (!q) {
    q = {question,
          category,
         marks: [],
         type,
         }
    dataS.perQuestion.push(q);
  }
  q.marks = [...q.marks,...formattedResponse];
  q.average = q.marks.reduce((a,b) => a + b, 0) / q.marks.length;
  // category stats:
  let c = dataS.perCategory.find(c=>c.category === category) 
  if (!c) {
    c = {
          category,
         marks: [],
         }
             dataS.perCategory.push(c);

  }
c.marks = [...c.marks,...formattedResponse];
  c.average = c.marks.reduce((a,b) => a + b, 0) / c.marks.length;


}
function isNumber(value) 
{
   return typeof value === 'number' && isFinite(value);
}

function addRespose(dataS, ratings) {
  /* ratings: {responder,responseAbout, question, response} */
  //const ;
  if (ratings.type === 'open') {
    addOpenResponse(dataS, ratings);
  } else {
    addRatingsResponse(dataS, ratings);
  }
}
function addOpenResponse(dataS, ratings) {
  const reviewAbout = findOrCreatePersonReport(dataS, ratings.responseAbout);
  if (ratings.response && ratings.response.length > 0) {
    let question = findOrCreateQuestion(reviewAbout, ratings);
    question.openAnswers.push(ratings.response);
  }

}
function addRatingsResponse(dataS, ratings) {
  for (let i = 0; i < ratings.responseAbout.length; ++i) {
    let responseAbout = ratings.responseAbout[i];
    let isSelf = responseAbout.includes('Self-');
    if (isSelf) {
      responseAbout = responseAbout.substring('Self-'.length);
    }
    const reviewAbout = findOrCreatePersonReport(dataS, responseAbout);

    if (!reviewAbout.responders.find(r => r === ratings.responder)) {
      reviewAbout.responders.push(ratings.responder);
    }
    const question = findOrCreateQuestion(reviewAbout, ratings);

    if (ratings.response[i]) {
      if (isSelf) {
        question.selfMark = ratings.response[i];
      } else {
        question.peerMarks.push(ratings.response[i]);
      }
    };

  }
}

function findOrCreatePersonReport(dataS, personName) {
  let reviewAbout = dataS.perPerson.find(p => p.name === personName);
  if (!reviewAbout) {
    reviewAbout = {
      name: personName,
      responders: [],
      reviews: []
    }
    dataS.perPerson.push(reviewAbout);
  }
  return reviewAbout;
}

function findOrCreateQuestion(reviewAbout, ratings) {
  let question = reviewAbout.reviews.find(q => q.question === ratings.question);
  if (!question) {
    question = {
      question: ratings.question,
      category: ratings.category,
      selfMark: undefined,
      peerMarks: [],
      openAnswers: [],
      type: ratings.type
    }
    reviewAbout.reviews.push(question);
  }
  return question;
}


//perPerson = [
//   {
//     name: 'baruch',
//     reviews: [
//       {
//         questions: 'question1',
//         category: 'category1',
//         selfMark: [7],
//         peerMarks: [5,3,5,6],
//         reviewers: ['person1', 'person2','3','4']
//       }
//     ]
//   },]

function readFormsMetadata(sheetName) {
  Logger.log(`reading data from: ${sheetName}`);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (sheet === null) {
    Logger.log(`sheet doesnt exist`);
  }
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 1 || lastColumn < 1) {
    Logger.log(`sheet's data seems weird`);
  }

  const range = sheet.getRange(1, 1, lastRow, lastColumn);
  const forms = range.getValues().map(val => { return { formId: val[0], name: val[1], publicUrl: val[2], editUrl: val[3] } });

  Logger.log(`got ${forms.length} forms`);

  return forms;

}
