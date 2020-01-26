const googleSpreadsheet = require('google-spreadsheet');
const credentials = require('./client_google_drive_api.json');
const {
    promisify
} = require('util');
const _ = require('lodash');
/**
 * J'ai travaillé avec 'lowdb' un package qui permet 
 * de rendre rendre un fichier JSON comme BD locale
 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter)
// Le lien du document : https://docs.google.com/spreadsheets/d/18B-y7IiDvmXqSZiAdk5gv3gQDxmwUxTfH05d2zSjqtY/edit#gid=0
const documentId = '18B-y7IiDvmXqSZiAdk5gv3gQDxmwUxTfH05d2zSjqtY';

// Les champs qu'on va stocker dans la BD
const studentsFields = ['id', 'studentname', 'gender', 'classlevel', 'homestate', 'major', 'extracurricularactivity'];

// Si le fichier est vide il faut l'initier pour travailler avec lowdb
const initDatabase = () => {
    db.defaults({
            students: []
        })
        .write();
}
/**
 * Cette fonction utilise les fonctions findStudentById,updateStudentById & insertStudent
 * Son but est d'insérer les nouvaux record et modifier qui existent dèja 
 */
const insertUpdateStudentIfNotExists = (student) => {
    const studentById = findStudentById(student);
    if (studentById) {
        if (!_.isEqual(studentById, student)) {
            updateStudentById(student);
        }
    } else {
        insertStudent(student)
    }
}

// Chercher dans la BD avec un id
const findStudentById = (student) => {
    return db.get('students')
        .find({
            id: student.id
        })
        .value();
}
// Modifier un record existant 
const updateStudentById = (student) => {
    db.get('students')
        .chain()
        .find({
            id: student.id
        })
        .assign(student)
        .write()
}
// Insérer un record 
const insertStudent = (student) => {
    db.get('students').push(student).write();
}
/**
 * La fonction main qui collecte la data du Spreadsheet 
 * Et l'insère ou la modifie
 */
const accessSpreadsheet = async () => {
    const doc = new googleSpreadsheet(documentId);
    await promisify(doc.useServiceAccountAuth)(credentials)
    const info = await promisify(doc.getInfo)();
    const sheet = info.worksheets[0];
    let rows = await promisify(sheet.getRows)({
        offset: 1
    });
    rows.forEach(student => {
        let formattedStudent = _.pick(student, studentsFields);
        insertUpdateStudentIfNotExists(formattedStudent);
    });
}
// Appel des fonctions
initDatabase();
accessSpreadsheet();