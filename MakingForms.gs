


function produceFeedbackForms() {

  const questions = getQuestions();
  if (!questions || questions.length < 1) {
    return;
  }

  const people = getPeopleByWhoTheyLikeToGetFeedbackFrom();
  if (!people || people.length < 1) {
    return;
  }
  const createdForms = [];

for (let [formFiller, feedbackAbout] of Object.entries(people)) {
    
    console.log('creating form for: ',formFiller,'. who will give feedback about: ', feedbackAbout);

    const title = `Hey ${formFiller}, you have been chosen to give feedback`;
    const form = FormApp.create(title);
  

    form.setDescription(`
Please answer these questions thoughtfully and thoroughly to give valuable feedback to yourself and to your peers.

The goal: to help everyone improve. Be accurate. Giving someone all 9s is useless to them and a waste of your time.  
** You don't have to answer irrelevant questions, just leave it empty **
  
**** Ranking guide ****


   1: Needs significant improvement.
      This rating indicates that the work or performance being evaluated is far below the expected standards and requires significant effort to bring it up to an acceptable level.

   2: Poor. 
      This rating indicates that the work or performance being evaluated is below the expected standards and requires significant effort to bring it up to an acceptable level.

   3: Below average. 
      This rating indicates that the work or performance being evaluated is below the expected standards, but may be acceptable with some improvements.

   4: Average. 
      This rating indicates that the work or performance being evaluated is generally in line with the expected standards, but may have some areas for improvement.

   5: Above average. 
      This rating indicates that the work or performance being evaluated is generally above the expected standards, but may still have some areas for improvement.

   6: Good. 
      This rating indicates that the work or performance being evaluated is generally very good and meets the expected standards.

   7: Very good. 
      This rating indicates that the work or performance being evaluated is of a high quality and meets or exceeds the expected standards.

   8: Excellent. 
      This rating indicates that the work or performance being evaluated is of a very high quality and meets or exceeds the expected standards in a manner that is exceptional or outstanding.

   9: Perfect. 
      This rating indicates that the work or performance being evaluated is of the highest quality and meets or exceeds the expected standards in every way, with no room for improvement. 



Fine print:
Your results will be aggregated with the feedback of others and anonymous to the recipients.
The feedback report might include the list of people that participated in giving the feedback
The results are compiled using a script but EMs can ACCESS them.


`);
    form.setLimitOneResponsePerUser(true).setAllowResponseEdits(true);




    let currentCategory = '';
    questions.forEach(q => {
      if (currentCategory !== q.category) {
        currentCategory = q.category;
        addCategorySection(form, currentCategory);
        Logger.log(`Category: ${currentCategory}`);
      }

      addQuestion(form, q, feedbackAbout, formFiller);

    });
    const publishedUrl = form.getPublishedUrl();
    Logger.log('Published URL: ' + form.getPublishedUrl());
    Logger.log(`Published`);
    Logger.log('Editor URL: ' + form.getEditUrl());
    Logger.log('FormID : ' + form.getId());
    const formId = form.getId();


    createdForms.push({
      for: formFiller,
      formId: form.getId(),
      publishURL: form.getPublishedUrl(),
      editURL: form.getEditUrl()
    })
  };

  Logger.log('saving form data to the sheet');

  const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('form collection: ' + (new Date()).toGMTString());
  createdForms.forEach(form => {
    const row = [form.formId, form.for, form.publishURL, form.editURL];
    const nextRow = newSheet.getLastRow() + 1; // get next row
    newSheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

  });

  Logger.log('done');


}


function addCategorySection(form, category) {
  form.addPageBreakItem()
    .setTitle(category);
}

function addQuestion(form, question, person, formFiller) {
  const copyOfPerson = [`Self-${formFiller}`, ...person.map(x => x)];

  let answers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  if (question.answers && question.answers.length > 0) {
    answers = question.answers.split(',');
  }
  if (question.category === 'Open') {
    const txt = form.addSectionHeaderItem();
    txt.setTitle(question.question);
    copyOfPerson.map(p => {
      const paragramItem = form.addParagraphTextItem();
      paragramItem.setHelpText(question.question);
      paragramItem.setTitle(p);
    })
  }
  else { // multiple choice grid is the default
    form.addGridItem().setTitle(question.question).setHelpText("\nDescription and examples: \n" + question.description)

      .setRows(copyOfPerson)
      .setColumns(answers);
  }
}

function getPeopleByWhoTheyLikeToGetFeedbackFrom() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("US-IC-March-Run2");
  if (sheet != null) {
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    if (lastRow < 1 || lastColumn < 1) {
      Logger.log(`sheet's data seems weird no peopleee`);
    }


    const whoWantsFeedbackFromWho = sheet.getRange(1, 1, lastRow, lastColumn).getValues()
      .map(p => p.filter(m => m.toString().length > 0));
    
    Logger.log(`got ${whoWantsFeedbackFromWho.length} people who want feedback`);

    const feedbackGivers = {};

    whoWantsFeedbackFromWho.forEach(personsList => {
      const thePersonWhoWantsFeedback = personsList[0];
      const peopleTheyWantFeedbackFrom = personsList.slice(1);


      peopleTheyWantFeedbackFrom.forEach(feedbackGiver => {
        if (!feedbackGivers[feedbackGiver]) {
          feedbackGivers[feedbackGiver] = [];
        }
        feedbackGivers[feedbackGiver].push(thePersonWhoWantsFeedback);
      })


    })
    

    Logger.log(`got ${Object.keys(feedbackGivers).length} feedback Givers`);
    return feedbackGivers;
  }

}


// form.addDateItem()
//     .setTitle('When were you born?');
// form.addGridItem()
//     .setTitle('Rate your interests')
//     .setRows(['Cars', 'Computers', 'Celebrities'])
//     .setColumns(['Boring', 'So-so', 'Interesting']);
// var item = form.addCheckboxItem();
// item.setTitle('What condiments would you like on your hot dog?');
// item.setChoices([
//         item.createChoice('Ketchup'),
//         item.createChoice('Mustard'),
//         item.createChoice('Relish')
//     ]);v 
