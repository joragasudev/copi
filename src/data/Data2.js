import Fuse from 'fuse.js'
/*
Examples:
TAGS:
In the DB =  |Key: 1 | Value: {name:'groceries'} | ; |Key:2 | Value: {name:'food'}|  
allTagsCache = [{key:1, name:'groceries'}, {key:2, name:'food'}]  

NOTES:
In the DB = |key: 12 | Value: {title: 'buy food', text: 'bread,tomatoes', noteTags: Array(2)} | ;
allNotesCache = [ {key: 12, title: 'buy food', text: 'bread,tomatoes', noteTags: ['groceries','food']}, {...}, ...]

CONFIG:
In the DB =  |Key: 'notesOrder' | Value: {name:'notesOrder' value:[1,2,4,3]} | ;  
notesOrderCache = [{key:'notesOrder', value:[1,2,4,3]}, ...] 

*/

//A LO MEJOR allnotesCache tiene que tener todas las notas, incluyendo las que estan en la papelera.
//PERO cuando se piden las notas "default", hay que filtrar por su componente 'state'. De este modo si cambiamos todos los lugares donde se pide
//allNotesCache por un metodo que haga (return this.allNC.filter(n=>n.state==='default') ), CREO que no afectaria al DND? <- tendria que
//recalcular el arreglo de notesOrderCache si se borra una nota?
class Data{

    constructor(){
        this.DBNAME = 'Copi-App-2';
        this.DBVERSION = 1;
        this.CONFIG_OBJECTSTORE_NAME = 'config'
        this.CONFIG_OBJECTSTORE_KEYPATH = 'name'
        this.NOTES_OBJECTSTORE_NAME = 'notes'
        this.TAGS_OBJECTSTORE_NAME = 'tags';
        this.TAGS_OBJECTSTORE_KEYPATH= 'name';
        this.DBConecction = null;

        this.allNotesCache = [];
        this.allTagsCache = []; 
        this.notesOrderCache = [];

        this.fuseOptions = {
            includeScore: true,
            keys: ['title','text'],
            ignoreLocation: true,
            threshold: 0.0,
        }
        this.fuse = null;
    }//end class constructor

    connect (){
        return new Promise((resolve,reject)=>{
            const request = indexedDB.open(this.DBNAME, this.DBVERSION);
            //Creating or updating de DB
            request.onupgradeneeded = event => {
                let dataBase = event.target.result;
                let objectStoreNotes = dataBase.createObjectStore(this.NOTES_OBJECTSTORE_NAME, { autoIncrement: true});
                objectStoreNotes.onerror = e=>{console.log(`Imposible to create NotesObjectStore: ${e}`)};
                let objectStoreConfig = dataBase.createObjectStore(this.CONFIG_OBJECTSTORE_NAME, { keyPath: this.CONFIG_OBJECTSTORE_KEYPATH});
                objectStoreConfig.onerror = e=>{console.log(`Imposible to create ConfigObjectStore: ${e}`)};
                let objectStoreTags = dataBase.createObjectStore(this.TAGS_OBJECTSTORE_NAME, { autoIncrement: true});
                objectStoreTags.onerror = e=>{console.log(`Imposible to create TagsObjectStore: ${e}`)};

                objectStoreConfig.transaction.oncomplete = event=>{
                    let objectStoreConfig = dataBase.transaction(this.CONFIG_OBJECTSTORE_NAME, "readwrite").objectStore(this.CONFIG_OBJECTSTORE_NAME);
                    objectStoreConfig.add({name:'notesOrder' , value: this.notesOrderCache});
                } 
              }//end onupgradeneeded

            request.onsuccess = (event) =>{
                this.DBConecction = event.target.result;
               
                let transaction = this.DBConecction.transaction([this.CONFIG_OBJECTSTORE_NAME,this.NOTES_OBJECTSTORE_NAME,this.TAGS_OBJECTSTORE_NAME], "readonly");
                
                //aca tendria tambien que recuperar el indice de Fuse.
                //Retrieve all app configs.
                let objectStoreConfig = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME);
                let notesOrderRequest =objectStoreConfig.get('notesOrder'); 
                notesOrderRequest.onsuccess= e=>{this.notesOrderCache = e.target.result.value; };

                //Retrieve all notes.
                let objectStoreNotes = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME);
                let notesWithKeys = [];
                let openNotesCursorRequest = objectStoreNotes.openCursor();//ASYNC
                openNotesCursorRequest.onsuccess = event =>{
                    let cursor = event.target.result;
                    if(cursor){
                        notesWithKeys.push({ key:cursor.key,
                                            title:cursor.value.title,
                                            text:cursor.value.text,
                                            noteTags:[...cursor.value.noteTags],
                                            state:cursor.value.state,
                                            lastModifyDate:cursor.value.lastModifyDate,
                                            creationDate:cursor.value.creationDate,

                                            //lo que tenga mas. ej lastModificationDate, creationDate, etc,etc.
                                            });
                        cursor.continue();
                    }else{
                        this.allNotesCache = [...this.sortNotes(notesWithKeys)];
                        this.fuse = new Fuse ( this.allNotesCache,this.fuseOptions);
                    }
                }

                //Retrieve all tags.
                let objectStoreTags = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME);
                let tagsWithKeys = [];
                let openTagsCursorRequest = objectStoreTags.openCursor();//ASYNC
                openTagsCursorRequest.onsuccess = event =>{
                    let cursor = event.target.result;
                    if(cursor){
                        tagsWithKeys.push({ key:cursor.key,
                                            name:cursor.value.name,
                                            });
                        cursor.continue();
                    }else{
                        this.allTagsCache = [...this.sortTags(tagsWithKeys)];
                    }
                }

                //All jobs completed.
                transaction.oncomplete = event =>{
                    resolve();
                }
              }//fin onsuccess

            request.onerror = (event) => {reject(console.log(`ERROR at creating the DB. Event: ${event}`));}
        });
    }

    //Cualquier metodo que modifique o cree en la BD, debe encargarse tambien de actualizar la cache.
    //Ademas puedo tener un metodo que se llame refreshCache(), que tire todo a la mierda y busque directamente todo de nuevo desde la BD.
//-------------HELPERS--------------
sortNotes(notesArray){
    notesArray.sort((noteA,noteB)=>{
        return (this.notesOrderCache.indexOf(noteA.key) - this.notesOrderCache.indexOf(noteB.key));
    });
    return notesArray;
} 

sortTags(tagsArray){
    return [...tagsArray.sort((tagA,tagB)=>{
        if(tagA.name < tagB.name)
            return -1;
        if(tagA.name > tagB.name)
            return 1;
        return 0;
    })]; 
}

//-------------NOTES-----------------
//Save a new note and resolve with the updated allNotesCache
saveNewNote(newNote) {
    return new Promise((resolve, reject) => {
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME,this.CONFIG_OBJECTSTORE_NAME], "readwrite");
        
        //Save the note to the DB, and getting the new key.
        let objectStoreNotes = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME);
        const creationDate = Date.now(); 
        const state = 'listed';
        const additionalData = {state:state, lastModifyDate:creationDate, creationDate:creationDate};
        let addNoteRequest = objectStoreNotes.add({...newNote, ...additionalData});
        let newNoteKey = -1;
        addNoteRequest.onsuccess = event =>{
            newNoteKey = event.target.result;
        }
 
        //Add the new note key, to the notesOrder array.     
        let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME);
        let requestNotesOrderConfig = configObjectStore.get('notesOrder');
        requestNotesOrderConfig.onsuccess = event=>{
            let data = event.target.result;
            data.value = [newNoteKey,...data.value];
            configObjectStore.put(data);
        }
        
        //On complete, update the notesOrdeCache, the search index, and the allNotesCache.
        //then resolve whith the new allNotesCache
        transaction.oncomplete = event => {
            //updating cache:
            this.notesOrderCache =[newNoteKey,...this.notesOrderCache];
            const newNoteWithId ={key:newNoteKey, ...newNote, ...additionalData}; 
            this.allNotesCache = [...this.sortNotes([newNoteWithId ,...this.allNotesCache])];
            this.fuse.setCollection(this.allNotesCache); //fuse.add() Agrega a la coleccion y al indice pero raro.
            resolve(this.allNotesCache); 
        };

        transaction.onerror = event => {console.log(`ERROR: cannot save the note. ${event}`);};
    });
}
//Update a note finded by key, and resolve with the updated allNotesCache 
updateNote(noteToUpdate){
    return new Promise((resolve,reject)=>{
        const {key,title,text,noteTags} = noteToUpdate;
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let updateRequest = objectStore.get(key);
        
        let note = null;
        updateRequest.onsuccess = event =>{
            note = event.target.result;
            note.text = text;
            note.title = title;
            note.noteTags = noteTags;
            note.lastModifyDate = Date.now();
            objectStore.put(note,key);
            }
        transaction.oncomplete = event=>{
            const indexToRemove = this.allNotesCache.findIndex((note)=>note.key === key);
            this.allNotesCache = [...this.allNotesCache.slice(0,indexToRemove),{key:key,...note},...this.allNotesCache.slice(indexToRemove+1) ];
            this.allNotesCache = [...this.sortNotes(this.allNotesCache)];
            this.fuse.setCollection(this.allNotesCache);
            resolve(this.allNotesCache); 
        }
    });
}
//MUCHO OJO ACA, tambien tendria que ver q hago con los orderNotesCache y la BD! pensar bien, por ahora es un croquis este metodo.
//Preguntas... allNotesCache tiene TODOS las notas y filtra las q no son 'trash'? <-como afectaria esto al DND?. O esas deberian ir en otro lado?.
//Tener en cuenta que se debe borrar tb la note.key del noteOrderCache
//Afectaria al DND porque el DND agarra los indices reales de la lista? 
sendNoteToTrash(key){
    return new Promise((resolve,reject)=>{
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let updateRequest = objectStore.get(key);
        
        let note = null;
        updateRequest.onsuccess = event =>{
            note = event.target.result;
            note.state = 'trash';
            note.lastModifyDate = Date.now();
            objectStore.put(note);
            }
        transaction.oncomplete = event=>{
            const indexToRemove = this.allNotesCache.findIndex((note)=>note.key === key);
            this.allNotesCache = [...this.allNotesCache.slice(0,indexToRemove),...this.allNotesCache.slice(indexToRemove+1) ];
            //aca tendria que sacar ese indice de noteOrderCache y de la DB
            this.allNotesCache = [...this.sortNotes(this.allNotesCache)];
            this.fuse.setCollection(this.allNotesCache);
            //ACA quiza tendria que agregar algo asi como (crear en DB primero obio) notesInTrashCan=[1,55,24,82] con su respectivo notesInTrashCanCache=[1,55,24,82]
            resolve(this.allNotesCache); 
        }
    }); 
}
//OJO ACA TB, Tengo que ver de donde se elimina definitivamente. La idea era que habia una papelera y que solo de ahi se elimina.
//a lo mejor tendria que tener un notesInTrashCan=[1,55,24,82] con su respectivo, notesInTrashCanCache=[1,55,24,82]
//Delete a note finded by key, and resolve with the updated allNotesCache
//Tener en cuenta que se debe bprrar tb la note.key del noteOrderCache
deleteNote(key){
    return new Promise((resolve,reject)=>{
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let deleteRequest = objectStore.delete(key);
        
        transaction.oncomplete = event=>{
            const indexToRemove = this.allNotesCache.findIndex((note)=>note.key === key);
            this.allNotesCache = [...this.allNotesCache.slice(0,indexToRemove),...this.allNotesCache.slice(indexToRemove+1) ];
            this.allNotesCache = [...this.sortNotes(this.allNotesCache)];
            this.fuse.setCollection(this.allNotesCache);
            resolve(this.allNotesCache); 
        }
    });
}
getNotes(){
    const nonDeletedNotes = this.allNotesCache.filter((note)=>note.state==='listed');
    return this.sortNotes(nonDeletedNotes);
}
getDeletedNotes(){
    //este metodo deberia retornar solo las notas con estado 'deleted', en orden de fecha de lastModify?.;
    const deletedNotes = this.allNotesCache.filter((note)=>note.status==='deleted');
    return deletedNotes;
}
reorderNotes (sourceKey,destinationKey){
    const reorderedNotesOrderCache = [...this.notesOrderCache];  
    reorderedNotesOrderCache.splice(
        reorderedNotesOrderCache.indexOf(destinationKey),
        0,
        reorderedNotesOrderCache.splice(reorderedNotesOrderCache.indexOf(sourceKey),1)[0]);

    this.notesOrderCache = [...reorderedNotesOrderCache];
    
    //asynchronously update the notesOrder in the DB.
    let transaction = this.DBConecction.transaction([this.CONFIG_OBJECTSTORE_NAME], "readwrite");
    let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME); 
    let requestNotesOrderConfig = configObjectStore.get('notesOrder');
    requestNotesOrderConfig.onsuccess = event=>{
        let data = event.target.result;
        data.value = this.notesOrderCache; 
        configObjectStore.put(data);
    }
    transaction.onerror = event => {console.log(`ERROR: Fail at save new order of notes. ${event}`);};
    transaction.oncomplete = event => { };
    
    return (this.getNotes());
}

//Reorder allNotesCache, and save notes order in DB and notesOrderCache.
reorderNotesViejo (sourceIndex,destinationIndex){
    const reorderedAllNotesCache = [...this.allNotesCache];  
    reorderedAllNotesCache.splice(destinationIndex,0,reorderedAllNotesCache.splice(sourceIndex,1)[0]);
    this.allNotesCache = [...reorderedAllNotesCache];
    
    const newNotesOrder = [];
    this.allNotesCache.forEach((note)=>{
      newNotesOrder.push(note.key);  
    })
    this.notesOrderCache = newNotesOrder;

    //asynchronously update the notesOrder in the DB.
    let transaction = this.DBConecction.transaction([this.CONFIG_OBJECTSTORE_NAME], "readwrite");
    let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME); 
    let requestNotesOrderConfig = configObjectStore.get('notesOrder');
    requestNotesOrderConfig.onsuccess = event=>{
        let data = event.target.result;
        data.value = newNotesOrder; 
        configObjectStore.put(data);
    }
    transaction.onerror = event => {console.log(`ERROR: Fail at save new order of notes. ${event}`);};
    transaction.oncomplete = event => { };
    
    return (this.allNotesCache);
}
//Search with Fuse.
searchNotes(term){
    if (term.trim()==='')
        return (this.allNotesCache);

    const result = this.fuse.search(term);
    const notesResult = result.map((result)=>result.item);
    return notesResult;
}
getNoteTextByKey(key){
    const note = this.allNotesCache.filter( note=>note.key === key)[0];
    return note.text; 
}

//------------------TAGS-------------------
//ahora los tags son en la BD -> Key: 1 , Value: {name:'cocina'}
saveNewTag(newTag){
    return new Promise ((resolve,reject)=>{
        this.saveNewTags([{name:newTag}]).then(response=>
            resolve(response)
        );
    });    
}
saveNewTags(newTags){
    return new Promise ((resolve,reject)=>{
        let transaction = this.DBConecction.transaction([this.TAGS_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME);
        let newTagsToCache = [];

        for (let newTag of newTags){
            let addRequest = objectStore.add({name:newTag.name});
            addRequest.onsuccess = e=>{
                let newKey = e.target.result;
                newTagsToCache.push({key:newKey, name:newTag.name});
            }
            addRequest.onerror = e=>{console.log(`ERROR: Impossible to save the new tag: ${newTag}. Abort all tags saving. ${e}`)};
        }
       
        transaction.oncomplete = event=>{
            this.allTagsCache = [...this.sortTags([...newTagsToCache,...this.allTagsCache])];
            resolve(this.allTagsCache);
        }
    });
}
deleteTags(tagsToDelete){//tagToDelete contiene las keys de los tags a eliminar ej: [1,2,5,663,23]
    return new Promise((resolve,reject)=>{
        const tagsKeysToDelete = tagsToDelete.map(tagToDelete => tagToDelete.key);
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME,this.TAGS_OBJECTSTORE_NAME], "readwrite");
        let notesObjectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let tagsObjectStore = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME);

        function includesTagsToDelete(noteTagKeyList,tagsKeysToDelete){
            for (let noteTagKey of noteTagKeyList){
                if (tagsKeysToDelete.includes(noteTagKey))
                    return true;
            }
            return false;
        }

        //Busco en cache solo las notas afectadas, asi no tengo que buscar en la BD TODAS las notas.
        const notesToEdit = this.allNotesCache.filter((note)=>includesTagsToDelete(note.noteTags,tagsKeysToDelete))
        notesToEdit.forEach((note)=>{
            let updateNoteRequest = notesObjectStore.get(note.key);
            updateNoteRequest.onsuccess = event=>{
                let retrievedNote = event.target.result;
                //retrievedNote.lastModifyDate = new Date();
                retrievedNote.noteTags = retrievedNote.noteTags.filter((tag)=>!tagsKeysToDelete.includes(tag)); 
                notesObjectStore.put(retrievedNote,note.key);
            }
            updateNoteRequest.onerror = e =>{console.log(`ERROR: Cant update tag list on note ${note.key}. ${e}`);}
        });

        //delete tags from db
        tagsKeysToDelete.forEach((tagToDelete)=>{
            let deleteTagRequest = tagsObjectStore.delete(tagToDelete);
            deleteTagRequest.onerror = e=>{console.log(`ERROR: Cant delete tag: ${tagToDelete}. ${e}`);}
        });

        transaction.oncomplete = e=>{
            //Update notes and tags caches.
            this.allNotesCache = this.sortNotes (this.allNotesCache.map((note)=>{
                if(notesToEdit.some((noteToEdit)=>noteToEdit.key === note.key)){
                    const filteredTags = note.noteTags.filter((tag)=>!tagsKeysToDelete.includes(tag));
                    return {...note,noteTags:filteredTags};
                }
                return {...note} 
                })
            );
            this.allTagsCache = this.sortTags(this.allTagsCache.filter((tag)=>!tagsKeysToDelete.includes(tag.key)));
            resolve();
        }
    });
}
updateTags(tagsToUpdate){//tagsToUpdate = [{key:2, name:'nuevoName'}, {key:15, name:'newTagName'} ..
    return new Promise ((resolve,reject)=>{
        let transaction = this.DBConecction.transaction([this.TAGS_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME);  
    
        for (let tagToUpdate of tagsToUpdate){
            let updateRequest = objectStore.get(tagToUpdate.key);
            updateRequest.onsuccess = e=>{
                let retrievedTag = e.target.result;
                retrievedTag.name =tagToUpdate.name;
                objectStore.put(retrievedTag,tagToUpdate.key); 
            } 
        }
    
        transaction.oncomplete= event =>{
            //updatear cache. [{key:1,name:'viejo'},{},{},{}...]
            //                [{key:1, name:'nuevo'},{}]
            let updatedTagsCache = [];
            for (let tag of this.allTagsCache){
                const tagToUpdate= tagsToUpdate.find((tagToUpdate)=>tagToUpdate.key === tag.key);
                tagToUpdate? updatedTagsCache.push({...tagToUpdate}) : updatedTagsCache.push({...tag});
            }
            this.allTagsCache = this.sortTags(updatedTagsCache);
            resolve();
        }
    });
}
applyTagsChanges(changesArr){
    return new Promise((resolve,reject)=>{
        //changesArr = [ {type:'create', payload:{localKey:-2, name:'zzz'}},{type:'delete', payload:{key:3, name:'car'}},{type:'update', payload:{key:13, name:'cocinas'}} ]
        const deleteTheseTags = changesArr.filter(change=>change.type === 'delete').map(deleteChange=>{return {key:deleteChange.payload.key}});//[{key:12},{key:33}]
        const createTheseTags = changesArr.filter(change=>change.type === 'create').map(createChange=>{return {name:createChange.payload.name}});//[{name:'newTag1'},{name:'newSuperTag2'}]
        const updateTheseTags = changesArr.filter(change=>change.type === 'update').map(updateChange=>{return {key:updateChange.payload.key, name:updateChange.payload.name}});//[{key:1 ,name:'updatedName'},{key:3, name:'updatedName2'}]

        //Ahora tendria que llamar a 3 metodos que retornen una promesa, y encadenar then()s
        //Ver como es la sintaxis mas bonita de esto si existe.:
        this.deleteTags(deleteTheseTags).then((r)=>{
            this.saveNewTags(createTheseTags).then((r)=>{
                this.updateTags(updateTheseTags).then((r)=>{
                    resolve();
                })
            })
        });

    });
}
getTagsByIds(tagArray = null){
    if(tagArray===null)
        return this.allTagsAvailable;

    const filteredTags = this.allTagsCache.filter( tag=>tagArray.includes(tag.key) )
    return filteredTags;
}


}//end class Data
export const AppData = new Data();