function getQuestions() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("questions");
  //Logger.log(`last question: column: ${sheet.getLastColumn()} row: ${sheet.getLastRow()}`);
  if (sheet != null) {
    const range = sheet.getRange('A2:D500');
    const questions = range.getValues().filter(val => val[0] !== '').map(val => { return { category: val[0], question: val[1], answers: val[2],description:val[3] } });

    Logger.log(`got ${questions.length} questions`);

    return questions;
  }

}
function getCategoryForQuestion(questions, question) {
  const found = questions.find(q=>q.question === question);
  if (found) {
    return found.category;
  }
}
