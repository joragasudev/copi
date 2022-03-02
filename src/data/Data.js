//Clase DATA encargada de manejar la IndexedDB y mantener algunos datos relevantes...
class Data{

    constructor(){
        this.DBNAME = 'Copi-App';
        this.DBVERSION = 1;
        this.NOTES_OBJECTSTORE_NAME = 'notes'
        this.NOTES_OBJECTSTORE_KEYPATH = 'id'
        this.CONFIG_OBJECTSTORE_NAME = 'config'
        this.CONFIG_OBJECTSTORE_KEYPATH = 'key'
        this.lastNoteId = 1;
        this.allNotesList = [];
        this.testNoteList = [{id:101,title:'titulo1'},{id:102,title:'titulo2'},{id:103,title:'titulo3'}]
        this.connection = null;
        this.notesOrder = [];

        //this.connect().then((connection)=>this.connection = connection);
    }

    
    connect (){
        return new Promise((resolve,reject)=>{
            const request = indexedDB.open(this.DBNAME, this.DBVERSION);
            request.onupgradeneeded = event => { 
                let dataBase = event.target.result;
                let objectStoreNotes = dataBase.createObjectStore(this.NOTES_OBJECTSTORE_NAME, { keyPath: this.NOTES_OBJECTSTORE_KEYPATH});
                let objectStoreConfig = dataBase.createObjectStore(this.CONFIG_OBJECTSTORE_NAME, { keyPath: this.CONFIG_OBJECTSTORE_KEYPATH});
                
                objectStoreConfig.transaction.oncomplete = event=>{
                    let objectStoreConfig = dataBase.transaction(this.CONFIG_OBJECTSTORE_NAME, "readwrite").objectStore(this.CONFIG_OBJECTSTORE_NAME);
                    objectStoreConfig.add({key:'lastNoteId' , value: this.lastNoteId});
                    objectStoreConfig.add({key:'notesOrder' , value: this.notesOrder});
                   //carga de test: 
                    //let notasObjectStore = dataBase.transaction("notes", "readwrite").objectStore("notes");
                    //this.testNoteList.forEach(nota=>notasObjectStore.add(nota));
                } 
                
                //aca tendria que crear la otra tabla, la que tiene el lastID y eso. Luego la tendria qe
                // cargar con los datos inciales. Finalemente en onsuccess o oncomplete tendria que 
                // recuperar esos datos para cargarlos en las variables de clase... y q ya queden.
                //dataBase.createObjectStore(this.NOTES_ORDER_OBJECTSTORE, { keyPath: this.NOTES_ORDER_OBJECTSTORE_KEYPATH});
              }
            request.onsuccess = (event) =>{
                let dataBase = event.target.result;
                this.connection = dataBase;
                //aca tendria que recuperar y setear lastID y esas kks
                let transaction = this.connection.transaction([this.CONFIG_OBJECTSTORE_NAME], "readonly");
                let objectStoreConfig = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME);
                
                let lastNoteIdRequest =objectStoreConfig.get('lastNoteId'); 
                lastNoteIdRequest.onsuccess= e=>{this.lastNoteId = e.target.result.value};
                let notesOrderRequest =objectStoreConfig.get('notesOrder'); 
                notesOrderRequest.onsuccess= e=>{this.notesOrder = e.target.result.value};
                resolve();
              }
            request.onerror = (event) => {
                reject(console.log(`ERROR at creating the DB. Event: ${event}`));
              }
        });
    }

    getAllNotes() {
        return new Promise((resolve, reject) => {
          let transaction = this.connection.transaction([this.NOTES_OBJECTSTORE_NAME], "readonly");
          transaction.oncomplete = event => {};
          transaction.onerror = event => {
              console.log('ERROR: impossible to get Notes.');
              reject('error');
          };
          let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
          objectStore.getAll().onsuccess = event => {
            this.allNotesList= [...event.target.result];
            resolve(event.target.result);
          };
        });
    }

    /*
    //este metodo tendria que :
    //0-incertarle el id aca? : nota = {id:++NoteID, ...newNote}
    //1-Incertar en la DB la nueva nota.
    //2-Actualizar la noteOrder local y la de la BD.
    //3-Actualizar el lastNoteID local y el de la BD.
    //4-Recuperar de la BD los nuevos datos, (luego llamar al callback que setee el estado desde React.)
    */
    saveNewNote(newNote) {
        return new Promise((resolve, reject) => {
          let transaction = this.connection.transaction([this.NOTES_OBJECTSTORE_NAME,this.CONFIG_OBJECTSTORE_NAME], "readwrite");
          transaction.oncomplete = event => {console.log('2');/*Tendria aca q mandar a actualizar el orden, y el lastID en la BD*/};
          transaction.onerror = event => {console.log('ERROR: algo peto al guardar el dato!');};
          let lastID = ++this.lastNoteId;

          let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
          let request = objectStore.add({id:lastID,...newNote});
          request.onsuccess = event => {
              //resolve();
              console.log('1');
              resolve(this.getAllNotes());
          };

          let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME);
          let requestLastNoteIdConfig = configObjectStore.get('lastNoteId');
          requestLastNoteIdConfig.onsuccess = event=>{
              let data = event.target.result;
              data.value = lastID;
              configObjectStore.put(data);
          }
          let requestNotesOrderConfig = configObjectStore.get('notesOrder');
          requestNotesOrderConfig.onsuccess = event=>{
              let data = event.target.result;
              console.log(`data es ${data}`);
              data.value = [lastID,...data.value];
              this.notesOrder =[lastID,...data.value]; 
              configObjectStore.put(data);
          }
          //aca tendria que hacer lo mismo con el orderlist.

        });
    }
    
   //ver bien este metodo, porahi lo puedo reutilzar para ordenar otras vistas. 
   orderArrayByIds(arr){
    arr.sort((a,b)=>{
        return (this.notesOrder.indexOf(a.id) - this.notesOrder.indexOf(b.id));
    });
    return arr;
   } 

}//fin clase Data


export const NoteData = new Data(); 
//export default Data;