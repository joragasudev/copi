import ClipboardJS from "clipboard";
import Fuse from 'fuse.js'
/*
You use IDBDatabase to start transactions, IDBTransaction to set the mode of the transaction (e.g. is it readonly or readwrite), and you access an IDBObjectStore to make a request.
https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction
//Si creo distintas transacciones, tipo : t1,t2,t3,t4, y las abro en ese orden,se van a ejecutar en ese orden.
*/

//Clase DATA encargada de manejar la IndexedDB y mantener algunos datos relevantes...
class Data{

    constructor(){
        this.DBNAME = 'Copi-App';
        this.DBVERSION = 1;
        this.NOTES_OBJECTSTORE_NAME = 'notes'
        this.NOTES_OBJECTSTORE_KEYPATH = 'id'
        this.CONFIG_OBJECTSTORE_NAME = 'config'
        this.CONFIG_OBJECTSTORE_KEYPATH = 'key'
        this.TAGS_OBJECTSTORE_NAME = 'tags'
        this.lastNoteId = 0;
        this.allNotes = [];
        this.connection = null;
        this.notesOrder = [];
        this.allTagsAvailable = []; //[{id:1, name:'compras'},{id:2, name:'tareas raras'}, ...]

        this.fuseOptions = {
            includeScore: true,
            keys: ['title','text'],
            ignoreLocation: true,
            threshold: 0.0,
        }
        this.fuse = null;

        //this.connect();
        //this.connect().then((connection)=>this.connection = connection);
        //tengo que asegurar que antes q nada se cree esta instancia y esperar a q conecte. como?
    }

    
    connect (){
        return new Promise((resolve,reject)=>{
            const request = indexedDB.open(this.DBNAME, this.DBVERSION);
            //Creating or updating de DB
            request.onupgradeneeded = event => {
                let dataBase = event.target.result;
                let objectStoreNotes = dataBase.createObjectStore(this.NOTES_OBJECTSTORE_NAME, { keyPath: this.NOTES_OBJECTSTORE_KEYPATH});
                let objectStoreConfig = dataBase.createObjectStore(this.CONFIG_OBJECTSTORE_NAME, { keyPath: this.CONFIG_OBJECTSTORE_KEYPATH});
                let objectStoreTags = dataBase.createObjectStore(this.TAGS_OBJECTSTORE_NAME, { autoIncrement: true});

                objectStoreConfig.transaction.oncomplete = event=>{
                    let objectStoreConfig = dataBase.transaction(this.CONFIG_OBJECTSTORE_NAME, "readwrite").objectStore(this.CONFIG_OBJECTSTORE_NAME);
                    objectStoreConfig.add({key:'lastNoteId' , value: this.lastNoteId});
                    objectStoreConfig.add({key:'notesOrder' , value: this.notesOrder});
                    //objectStoreConfig.add({key:'allTagsAvailable' , value: this.allTagsAvailable});
                } 
              }//fin onupgradeneeded

            request.onsuccess = (event) =>{
                let dataBase = event.target.result;
                this.connection = dataBase;
                //Si creo distintas transacciones, tipo : t1,t2,t3,t4, y las abro en ese orden,
                //se van a ejecutar en ese orden.
                let transaction = this.connection.transaction([this.CONFIG_OBJECTSTORE_NAME,this.NOTES_OBJECTSTORE_NAME,this.TAGS_OBJECTSTORE_NAME], "readonly");
                
                let objectStoreConfig = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME);
                //aca tendria tambien que recuperar el indice de Fuse.
                let lastNoteIdRequest =objectStoreConfig.get('lastNoteId'); 
                lastNoteIdRequest.onsuccess= e=>{this.lastNoteId = e.target.result.value; };
                let notesOrderRequest =objectStoreConfig.get('notesOrder'); 
                notesOrderRequest.onsuccess= e=>{this.notesOrder = e.target.result.value; };
                // let allTagsAvailableRequest =objectStoreConfig.get('allTagsAvailable'); 
                // allTagsAvailableRequest.onsuccess= e=>{this.allTagsAvailable = e.target.result.value};
                
                let objectStoreTags = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME);
                let tagsWithIds = [];
                let openCursorRequest = objectStoreTags.openCursor();//ASYNC
                openCursorRequest.onsuccess = event =>{
                    let cursor = event.target.result;
                    if(cursor){
                        tagsWithIds.push({id:cursor.key, name:cursor.value});
                        cursor.continue();
                    }else{
                        this.allTagsAvailable = this.sortTags(tagsWithIds); 
                    }
                }
                //this.allTagsAvailable = tagsWithIds;
               //la iteracion del cursor es async. PLT para cuando termine de iterarse ya se renderizo todo con otros valores
               //como la var es por referencia, termina andando, pero qda feo. Tendria q resolver una vez q todo termine....

                let objectStoreNotes = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME);
                let getAllNotesRequest = objectStoreNotes.getAll()
                getAllNotesRequest.onsuccess = event => {
                    this.allNotes = [...this.orderArrayByIds(event.target.result)];
                    this.fuse = new Fuse ( this.allNotes,this.fuseOptions);
                    //resolve();
                  }; 
                
                  transaction.oncomplete = event =>{
                      resolve();
                  }
               
              }//fin onsuccess
            request.onerror = (event) => {
                reject(console.log(`ERROR at creating the DB. Event: ${event}`));
              }//fin onerror
        });
    }

    //a lo mejor getAllNotes solo tendria que devolver la lista local (this.allNotes)
    //y los metodos de connect, modificacion,eliminacion y creacion deberian encargarse de actualizar ese this.allNotes
    //solo deberia devolver el this.allNotes ordenado (this.orderArrayByIds(event.target.result)).
    getAllNotesViejo() {
        return new Promise((resolve, reject) => {
          let transaction = this.connection.transaction([this.NOTES_OBJECTSTORE_NAME], "readonly");
          transaction.oncomplete = event => {};
          transaction.onerror = event => {
              console.log('ERROR: impossible to get Notes.');
              reject('error');
          };
          let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
          objectStore.getAll().onsuccess = event => {
            this.allNotes = [...this.orderArrayByIds(event.target.result)];
            resolve([...this.allNotes]);
          };
        });
    }
    getAllNotes(){
        return ([...this.orderArrayByIds(this.allNotes)]);
    }
    updateNote(noteToUpdate){
        return new Promise((resolve,reject)=>{
        const {id,title,text,noteTags} = noteToUpdate;
        let transaction = this.connection.transaction([this.NOTES_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let updateRequest = objectStore.get(id);
        updateRequest.onsuccess = event =>{
            let note = event.target.result;
            note.text = text;
            note.title = title;
            note.noteTags = noteTags;
            objectStore.put(note);
            objectStore.getAll().onsuccess = event => {
                this.allNotes = [...this.orderArrayByIds(event.target.result)];
                // esto es costoso? reemplazo toda la coleccion por solo 1 mas?.si hago fuse.add agrega a la coleccion...
                this.fuse.setCollection(this.allNotes); 
                resolve(this.getAllNotes());
            }; 
            }
        });
    }
 
    sortTags(tagsArray){
        return [...tagsArray.sort((a,b)=>{
            if(a.name < b.name)
                return -1;
            if(a.name > b.name)
                return 1;
            return 0;
        })
        ]; 
    }
    addNewTag(newTag){
        return new Promise ((resolve,reject)=>{
            let transaction = this.connection.transaction([this.TAGS_OBJECTSTORE_NAME], "readwrite");
            let objectStore = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME);
            let addRequest = objectStore.add(newTag);
            addRequest.onsuccess = event =>{
                console.log(event);
                //Tendria aca que mandar a un metodo a que agregue localmente el tag : agregarTagLocal(e.target.value , newTag), y luego sort
                //lo que hago aca es recalcular todos los tagsLocales cada vez que agrego uno nuevo
                this.getAllTagsAvailable().then((tagsWithIds)=>{
                    this.allTagsAvailable = this.sortTags(tagsWithIds);
                    resolve();
                })
            }
        });
    }
    getAllTagsAvailable(){
        return new Promise((resolve,reject)=>{
            let transaction = this.connection.transaction([this.TAGS_OBJECTSTORE_NAME], "readonly");
            let objectStore = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME); 
            let tagsWithIds = [];
            
            objectStore.openCursor().onsuccess = event =>{
                let cursor = event.target.result;
                if(cursor){
                    tagsWithIds.push({id:cursor.key, name:cursor.value});
                    cursor.continue();
                }else{
                    console.log(tagsWithIds);
                    resolve(this.sortTags(tagsWithIds));
                }
            }
        });
    }
    getTagsByIds(tagArray = null){
        if(tagArray===null)
            return this.allTagsAvailable;

        const filteredTags = this.allTagsAvailable.filter((tag)=>{
            return (tagArray.includes(tag.id.toString()))
        })
        return filteredTags;
    }


    deleteTheseTags(deleteTheseTagsArray){
        //por por cada id de  deleteTheseTagsArray, mirar todas las notas y borrarle ese id de sus tags. Luego borrar ese tag de la tabla de tags.
        console.log('Entrando en deleteTheseTags..1');
        const deleteTheseTagsIdsArray = deleteTheseTagsArray.map((e)=>e.id.toString());
        console.log(deleteTheseTagsIdsArray);
        return new Promise ((resolve,reject)=>{
            if (deleteTheseTagsArray.length>0){
            //Tengo que editar todas las notas de la tabla 'notes' q tengna estos tags, y luego eliminar el tag de la tabla 'tags'.
            let transaction = this.connection.transaction([this.NOTES_OBJECTSTORE_NAME,this.TAGS_OBJECTSTORE_NAME], "readwrite");
            let notesObjectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
            let tagsObjectStore = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME); 

            this.allNotes.forEach((note)=>{
                let updateNoteRequest = notesObjectStore.get(note.id);
                updateNoteRequest.onsuccess = event=>{
                    let retrievedNote = event.target.result;
                    retrievedNote.noteTags = note.noteTags.filter((aNoteTag)=>!deleteTheseTagsIdsArray.includes(aNoteTag)); 
                    notesObjectStore.put(retrievedNote);
                } 
            })
            //Aca tendria que updatear this.allNotes, pero como lo de arriba es asyncronico, se va a setear mal
            //o bien lo seteo al final en transaction.oncomplete, o bien A lo mejor tendria que llamar al otro metodo por cada nota y listo?

            //Elimino todos los tags. A lo mejor esto deberia ser un metodo aparte, tipo promesa. y lo de arriba tambien.
            deleteTheseTagsArray.map((aTagIdToDelete)=>{
                let deleteTagRequest = tagsObjectStore.delete(aTagIdToDelete.id);
            })
            //Aca tendria que updatear todos los tags? this.allTagsAvailable ????????
            

            notesObjectStore.getAll().onsuccess = event => {
                this.allNotes = [...this.orderArrayByIds(event.target.result)];
            } 
            transaction.oncomplete = event=>{
                this.getAllTagsAvailable().then((allTags)=>{
                    this.allTagsAvailable = allTags;
                })
                resolve();
            }
        }
        else{resolve();}
        });
    }
    async createTheseTags(createTheseTagsArray){
        console.log('Entrando createTheseTags..2');
        console.log(createTheseTagsArray);
        return new Promise( async (resolve,reject)=>{
            if(createTheseTagsArray.length>0){
                for (let newTag of createTheseTagsArray){
                    console.log('voy a mandar a guardar ' + newTag.name);
                    await this.addNewTag(newTag.name); //esto es promesa!
               }
               resolve();
            }
            else{resolve();}
        });
    }
    updateTheseTags(updateTheseTagsArray){
        console.log('Entrando updateTheseTags..3');
        console.log(updateTheseTagsArray);
        return new Promise((resolve,reject)=>{
        if(updateTheseTagsArray.length>0){
            let transaction = this.connection.transaction([this.TAGS_OBJECTSTORE_NAME], "readwrite");
            let tagsObjectStore = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME); 

            updateTheseTagsArray.forEach((change)=>{
                let updateTagRequest = tagsObjectStore.get(parseInt(change.id)); 
                updateTagRequest.onsuccess = event=>{
                    let retrievedTag = event.target.result;
                    console.log(retrievedTag);
                    retrievedTag = change.name;
                    tagsObjectStore.put(retrievedTag,parseInt(change.id));//OJO ESTO NO ANDA PORQUE ES UN Tipo de dato primitivo?
                } 
            })
            transaction.oncomplete = event=>{
                this.getAllTagsAvailable().then((allTags)=>{
                    this.allTagsAvailable = allTags;
                    resolve();
                })  
            }
            // this.allTagsAvailable.forEach((tag)=>{
            //     let updateTagRequest = tagsObjectStore.get(tag.id);
            //     updateTagRequest.onsuccess = event=>{
            //         let retrievedTag = event.target.result;
            //         let changeForThisTag = updateTheseTagsArray.filter(t=>t.id.toString() === tag.id.toString());
            //         retrievedTag = changeForThisTag.lenght? retrievedTag[0].name : tag.name;
            //         tagsObjectStore.put(retrievedTag);
            //     } 
            // });
            // this.getAllTagsAvailable().then((allTags)=>{
            //     this.allTagsAvailable = allTags;
            //     resolve();
            // })
        }else{
            resolve();
        }

        });
    }
    applyTagChanges(changesArr){
        return new Promise((resolve,reject)=>{
            //[ {type:'create', payload:{localKey:33, name:'zzz'}},{type:'delete', payload:{localKey:3, id:12, name:'car'}},{type:'update', payload:{localKey:13, id:11, name:'cocinas'}} ]
            const deleteTheseTags = changesArr.filter(change=>change.type === 'delete').map(deleteChange=>{return {id:deleteChange.payload.id}});//[{id:12},{id:33}]
            const createTheseTags = changesArr.filter(change=>change.type === 'create').map(createChange=>{return {name:createChange.payload.name}});//[{name:'newTag1'},{name:'newSuperTag2'}]
            const updateTheseTags = changesArr.filter(change=>change.type === 'update').map(updateChange=>{return {id:updateChange.payload.id, name:updateChange.payload.name}});//[{id:1},{id:3}]

            //Ahora tendria que llamar a 3 metodos que retornen una promesa, y encadenar then()s
            //Ver como es la sintaxis mas bonita de esto si existe.:
            this.deleteTheseTags(deleteTheseTags).then((r)=>{
                this.createTheseTags(createTheseTags).then((r)=>{
                    this.updateTheseTags(updateTheseTags).then((r)=>{
                        resolve();
                    })
                })
            });

        });
    }


    saveNewNote(newNote) {
        return new Promise((resolve, reject) => {
            let transaction = this.connection.transaction([this.NOTES_OBJECTSTORE_NAME,this.CONFIG_OBJECTSTORE_NAME], "readwrite");
            let lastID = ++this.lastNoteId; //q pasa si la transaccion peta? no todo se rollbackea no?
            
            let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
            const newNoteWithId ={id:lastID,...newNote}; 
            let addRequest = objectStore.add(newNoteWithId);
            addRequest.onsuccess = event =>{
               this.fuse.add(newNoteWithId); //OJO esto agrega a this.allNotes!
            }
            objectStore.getAll().onsuccess = event => {
                this.allNotes = [...this.orderArrayByIds(event.target.result)];
                // esto es costoso? reemplazo toda la coleccion por solo 1 mas?.si hago fuse.add agrega a la coleccion...
                this.fuse.setCollection(this.allNotes); 
            }; 

            //aca tendria que actualizar el indice de Fuse (agregando el newNoteWithId);
                
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
                data.value = [lastID,...data.value];
                this.notesOrder =[lastID,...data.value];
                configObjectStore.put(data);
            }
            
            transaction.oncomplete = event => {
                console.log('fin transaccion');
                resolve(this.getAllNotes()); };
            transaction.onerror = event => {console.log('ERROR: algo peto al guardar el dato!');};
        });
    }
    reorderNotes (sourceIndex,destinationIndex){
            const newOrderedNotes = [...this.orderArrayByIds( this.allNotes )];  
            newOrderedNotes.splice(destinationIndex,0,newOrderedNotes.splice(sourceIndex,1)[0]);
            this.allNotes = newOrderedNotes;
            
            const newNotesOrder = [];
            newOrderedNotes.forEach((note)=>{
              newNotesOrder.push(note.id);  
            })
            this.notesOrder = newNotesOrder;

            //Luego le pego asincronicamente a la BD
            let transaction = this.connection.transaction([this.CONFIG_OBJECTSTORE_NAME], "readwrite");
            let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME); 
            let requestNotesOrderConfig = configObjectStore.get('notesOrder');
            requestNotesOrderConfig.onsuccess = event=>{
                let data = event.target.result;
                data.value = newNotesOrder; 
                configObjectStore.put(data);
            }
            transaction.oncomplete = event => { };//o newOrderedNotes es =
            transaction.onerror = event => {console.log('ERROR: fail at reoderingNotes ');};
            
            return ([...this.allNotes]);
    }
    reorderNotesViejo(sourceIndex,destinationIndex){
        return new Promise((resolve,reject)=>{
            const newOrderedNotes = [...this.orderArrayByIds( this.allNotes )];  
            newOrderedNotes.splice(destinationIndex,0,newOrderedNotes.splice(sourceIndex,1)[0]);
            const newNotesOrder = [];
            newOrderedNotes.forEach((note)=>{
              newNotesOrder.push(note.id);  
            })
            this.notesOrder = newNotesOrder;
            this.allNotes = newOrderedNotes;
            //seteo el nuevo arrorder y en el succes hago el resolve(arrToReturn);
            let transaction = this.connection.transaction([this.CONFIG_OBJECTSTORE_NAME], "readwrite");
            let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME); 
            let requestNotesOrderConfig = configObjectStore.get('notesOrder');
            requestNotesOrderConfig.onsuccess = event=>{
                let data = event.target.result;
                data.value = newNotesOrder; 
                configObjectStore.put(data);
            }
            
            transaction.oncomplete = event => {
                resolve(this.getAllNotes()); };//o newOrderedNotes es =
            transaction.onerror = event => {console.log('ERROR: fail at reoderingNotes ');};
        });//ret
    }
   searchNotes(term){
       //usa fuse a partir de this.allNotes, y retorna la mierda que devuelva fuse.
       if (term.trim()==='')
        return (this.getAllNotes());
       console.log(term);
       console.log(this.fuseOptions);
       console.log(this.fuse);
        //this.fuse.setCollection(this.allNotes);
        const result = this.fuse.search(term);
        const notesResult = result.map((result)=>result.item);
        console.log(notesResult);
        return notesResult;
   } 

   //ver bien este metodo, porahi lo puedo reutilzar para ordenar otras vistas. 
   orderArrayByIds(arr){
    arr.sort((a,b)=>{
        return (this.notesOrder.indexOf(a.id) - this.notesOrder.indexOf(b.id));
    });
    return arr;
   } 

   getNoteTextById(id){
       const note = this.allNotes.filter( note=>note.id.toString() ===id.toString())[0];
       return note.text; 
   }

}//fin clase Data
export const NoteData = new Data(); 


////////////////////CLIPBOARDJS (clipboardjs.com)///////////////////////////////////
// const clipboard = new ClipboardJS('.card-container');
const clipboard = new ClipboardJS ('.noteCardContainer', {
    text: function(trigger) {
        return NoteData.getNoteTextById(trigger.dataset.noteId);
    },
    //container: document.getElementById('note-card-container2')
});
clipboard.on('success', function(e) {
    // console.log(e);
    console.log(`Se copio esto: ${e.text}`);
    e.clearSelection();
});
clipboard.on('error', function(e) {
    console.error('Action:', e.action);
    console.error('Trigger:', e.trigger);
});
////////////////////CLIPBOARDJS///////////////////////////////////



