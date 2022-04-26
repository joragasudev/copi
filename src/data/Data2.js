import Fuse from 'fuse.js';
import ClipboardJS from 'clipboard';
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

NOTESORDERBYRAG
In the DB = |Key: 12 | Value: {tagKey:12 value:[1,2,4,3]} | ; 
notesOrderByTagCache = [ {key:12 value:[1,2,3,4]}, {key:19 value:[45,1]} , {key:33 value:[4]}, {key:48 value:[]} ]  
*/

class Data{

    constructor(){
        this.DBNAME = 'Copi-App-2';
        this.DBVERSION = 1;
        this.CONFIG_OBJECTSTORE_NAME = 'config'
        this.CONFIG_OBJECTSTORE_KEYPATH = 'name'
        this.NOTES_OBJECTSTORE_NAME = 'notes'
        this.TAGS_OBJECTSTORE_NAME = 'tags';
        this.TAGS_OBJECTSTORE_KEYPATH= 'name';
        this.NOTESORDERBYTAG_OBJECTSTORE_NAME = 'notesOrderByTag';
        this.NOTESORDERBYTAG_OBJECTSTORE_KEYPATH = 'tagKey'

        this.DBConecction = null;

        this.allNotesCache = [];
        this.allTagsCache = []; 
        this.notesOrderCache = [];
        this.notesOrderByTagCache = [];
        this.MAX_TEXT_LENGTH = 10;

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
                let objectStoreNotesOrderByTags = dataBase.createObjectStore(this.NOTESORDERBYTAG_OBJECTSTORE_NAME, { keyPath: this.NOTESORDERBYTAG_OBJECTSTORE_KEYPATH});
                objectStoreNotesOrderByTags.onerror = e=>{console.log(`Imposible to create notesOrderByTagObjectStore: ${e}`)};

                objectStoreConfig.transaction.oncomplete = event=>{
                    let objectStoreConfig = dataBase.transaction(this.CONFIG_OBJECTSTORE_NAME, "readwrite").objectStore(this.CONFIG_OBJECTSTORE_NAME);
                    objectStoreConfig.add({name:'notesOrder' , value: this.notesOrderCache});
                } 
              }//end onupgradeneeded

            request.onsuccess = (event) =>{
                this.DBConecction = event.target.result;
               
                let transaction = this.DBConecction.transaction([this.CONFIG_OBJECTSTORE_NAME,this.NOTESORDERBYTAG_OBJECTSTORE_NAME, this.NOTES_OBJECTSTORE_NAME,this.TAGS_OBJECTSTORE_NAME], "readonly");
                
                //aca tendria tambien que recuperar el indice de Fuse.
                //Retrieve all app configs.
                let objectStoreConfig = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME);
                let notesOrderRequest =objectStoreConfig.get('notesOrder'); 
                notesOrderRequest.onsuccess= e=>{this.notesOrderCache = e.target.result.value; };

                //Retrieve notesOrderByTagCache [{key:1 value:[1,2,3,4]} ,{},{}]
                let objectStoreNotesOrderByTagCache = transaction.objectStore(this.NOTESORDERBYTAG_OBJECTSTORE_NAME);
                let notesOrderByTagRequest =objectStoreNotesOrderByTagCache.getAll(); 
                notesOrderByTagRequest.onsuccess= e=>{this.notesOrderByTagCache = e.target.result; };


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
sortNotesViejo(notesArray){
    notesArray.sort((noteA,noteB)=>{
        return (this.notesOrderCache.indexOf(noteA.key) - this.notesOrderCache.indexOf(noteB.key));
    });
    return [...notesArray];
}
sortNotes(notesArray, orderArray = this.notesOrderCache){
    notesArray.sort((noteA,noteB)=>{
        return (orderArray.indexOf(noteA.key) - orderArray.indexOf(noteB.key));
    });
    return [...notesArray];
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
truncateText(text){
    //Se puede usar en CSS overflow:hidden; y text-overflow:ellipsis; y listo.
    return text.length <= this.MAX_TEXT_LENGTH? text : text.substring(0,this.MAX_TEXT_LENGTH)+'...';
}
//-------------NOTES-----------------
//Save a new note and resolve with the updated allNotesCache
saveNewNote(newNote) {
    return new Promise((resolve, reject) => {
        let newNoteTags = newNote.noteTags;
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME,this.CONFIG_OBJECTSTORE_NAME,this.NOTESORDERBYTAG_OBJECTSTORE_NAME], "readwrite");
        
        //Save the note to the DB, and getting the new key.
        let objectStoreNotes = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME);
        const creationDate = Date.now(); 
        const state = 'listed';
        const additionalData = {state:state, lastModifyDate:creationDate, creationDate:creationDate};
        let addNoteRequest = objectStoreNotes.add({...newNote, ...additionalData});
        let newNoteKey = -1;
        addNoteRequest.onsuccess = event =>{
            newNoteKey = event.target.result;

            //Add the new note key, to the notesOrder array.     
            let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME);
            let requestNotesOrderConfig = configObjectStore.get('notesOrder');
            requestNotesOrderConfig.onsuccess = event=>{
                let data = event.target.result;
                data.value = [newNoteKey,...data.value];
                configObjectStore.put(data);
            }

            //Updating notesOrderByTag
            let notesOrderByTagObjectStore = transaction.objectStore(this.NOTESORDERBYTAG_OBJECTSTORE_NAME);
            for (let tagKey of newNoteTags){
                let noteKey = newNoteKey;
                let notesOrderByTagRequest =  notesOrderByTagObjectStore.get(tagKey);
                notesOrderByTagRequest.onsuccess = event =>{
                    let notesOrderByTag = event.target.result;
                    let notesOrderByTagArray =notesOrderByTag.value; 
                    if (!notesOrderByTagArray.includes(noteKey))
                        notesOrderByTagArray=[...notesOrderByTagArray,noteKey];
                    // notesOrderByTagObjectStore.put({tagKey:tagKey, value:notesOrderByTagArray});
                    notesOrderByTagObjectStore.put(notesOrderByTag);
                }  
            }
        }

        
        //On complete, update the notesOrdeCache, the search index, and the allNotesCache.
        //then resolve whith the new allNotesCache
        transaction.oncomplete = event => {
            //updating cache:
            this.notesOrderCache =[newNoteKey,...this.notesOrderCache];
            const newNoteWithId ={key:newNoteKey, ...newNote, ...additionalData}; 
            this.allNotesCache = [...this.sortNotes([newNoteWithId ,...this.allNotesCache])];
            this.fuse.setCollection(this.allNotesCache); //fuse.add() Agrega a la coleccion y al indice pero raro.
            
            //updating notesOrderByTagCache 
            this.notesOrderByTagCache = this.notesOrderByTagCache.map((noteOrder)=>{
                if (!newNoteTags.includes(noteOrder.tagKey))
                    return noteOrder;
                else 
                    return ( {tagKey:noteOrder.tagKey, value: [...noteOrder.value,newNoteKey]} );
            });

            resolve(this.getNotes()); 
        };

        transaction.onerror = event => {console.log(`ERROR: cannot save the note. ${event}`);};
    });
}
//Update a note finded by key, and resolve with the updated allNotesCache 
updateNote(noteToUpdate){
    return new Promise((resolve,reject)=>{
        const {key,title,text,noteTags} = noteToUpdate;
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME,this.NOTESORDERBYTAG_OBJECTSTORE_NAME], "readwrite");
        let notesObjectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let updateRequest = notesObjectStore.get(key);
        
        let note = null;
        updateRequest.onsuccess = event =>{
            note = event.target.result;
            note.text = text;
            note.title = title;
            note.noteTags = noteTags;
            note.lastModifyDate = Date.now();
            notesObjectStore.put(note,key);

            //Updating notesOrderByTag 
            let notesOrderByTagObjectStore = transaction.objectStore(this.NOTESORDERBYTAG_OBJECTSTORE_NAME);
            let notesOrderByTagRequestKeys =  notesOrderByTagObjectStore.getAllKeys(); 
            notesOrderByTagRequestKeys.onsuccess = event =>{
                let allNotesOrderByTagsKeys = event.target.result;
                for (let notesOrderByTagKey of allNotesOrderByTagsKeys){
                    let notesOrderByTagRequest =  notesOrderByTagObjectStore.get(notesOrderByTagKey); 
                    notesOrderByTagRequest.onsuccess = event =>{
                        let notesOrderByTag = event.target.result;
                        if(noteTags.includes(notesOrderByTag.tagKey)){
                            if(!notesOrderByTag.value.includes(key)){
                                notesOrderByTag = {tagKey:notesOrderByTag.tagKey, value:[...notesOrderByTag.value,key]};
                            }
                        }
                        else{
                            if(notesOrderByTag.value.includes(key)){
                                let newValue = notesOrderByTag.value.filter((noteKey)=>noteKey!==key);
                                notesOrderByTag = {tagKey:notesOrderByTag.tagKey, value:[...newValue]};
                            }
                        }
                        notesOrderByTagObjectStore.put(notesOrderByTag); 
                    }
                }   
            }


        }
        //update notesOrderByTag

        transaction.oncomplete = event=>{
            const indexToRemove = this.allNotesCache.findIndex((note)=>note.key === key);
            this.allNotesCache = [...this.allNotesCache.slice(0,indexToRemove),{key:key,...note},...this.allNotesCache.slice(indexToRemove+1) ];
            this.allNotesCache = [...this.sortNotes(this.allNotesCache)];
            this.fuse.setCollection(this.allNotesCache);

            //update notesOrderByTag Cache.
            this.notesOrderByTagCache = this.notesOrderByTagCache.map((noteOrder)=>{
                if(noteTags.includes(noteOrder.tagKey)){
                    if (noteOrder.value.includes(key)){
                        return noteOrder;
                    }else{
                        return ( {tagKey:noteOrder.tagKey, value: [...noteOrder.value,key]} ); 
                    }
                }
                else{
                    if (noteOrder.value.includes(key)){
                        let newNoteOrderByTag = noteOrder.value.filter((noteKey)=>noteKey!== key)
                        return ( {tagKey:noteOrder.tagKey, value: [...newNoteOrderByTag]} ); 
                    }else{
                        return noteOrder;
                    }
                } 
            });
            // resolve(this.allNotesCache); 
            resolve(this.getNotes());
        }
    });
}
sendNoteToTrash(key){
    return this.sendNotesToTrash([key]);
}
sendNotesToTrash(keysArray){
    return new Promise((resolve,reject)=>{
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME,this.CONFIG_OBJECTSTORE_NAME,this.NOTESORDERBYTAG_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME); 
        let notesOrderByTagObjectStore = transaction.objectStore(this.NOTESORDERBYTAG_OBJECTSTORE_NAME); 

        keysArray.forEach((key)=>{
            let updateRequest = objectStore.get(key);
            let note = null;
            updateRequest.onsuccess = event =>{
                note = event.target.result;
                note.state = 'trash';
                //note.lastModifyDate = Date.now();
                objectStore.put(note,key);
            }
        });

        let requestNotesOrderConfig = configObjectStore.get('notesOrder');
        let newNotesOrder = this.notesOrderCache.filter((key)=> !keysArray.includes(key))
        requestNotesOrderConfig.onsuccess = event=>{
            let data = event.target.result;
            data.value = newNotesOrder; 
            configObjectStore.put(data);
        }
        //Updating notesOrderByTag 
        let notesOrderByTagRequestKeys =  notesOrderByTagObjectStore.getAllKeys(); 
        notesOrderByTagRequestKeys.onsuccess = event =>{
            let allNotesOrderByTagsKeys = event.target.result;
            for (let notesOrderByTagKey of allNotesOrderByTagsKeys){
                let notesOrderByTagRequest =  notesOrderByTagObjectStore.get(notesOrderByTagKey); 
                notesOrderByTagRequest.onsuccess = event =>{
                    let notesOrderByTag = event.target.result;
                    let newNotesOrderByTagValue= notesOrderByTag.value.filter((noteKey)=>!keysArray.includes(noteKey));
                    notesOrderByTag.value = newNotesOrderByTagValue;
                    notesOrderByTagObjectStore.put(notesOrderByTag); 
                }
            }   
        }

        transaction.onerror = event => {console.log(`ERROR: Fail at sending a note to trash can. ${event}`);};
        transaction.oncomplete = event=>{
            this.notesOrderCache = [...newNotesOrder];
            this.allNotesCache = this.allNotesCache.map((note)=>{
                if(keysArray.includes(note.key))
                    return ({...note, state:'trash'});
                return ({...note});
            });

            //updating notesOrderByTagCache
            this.notesOrderByTagCache = this.notesOrderByTagCache.map((notesOrder)=>{
                let newNotesOrderValue = notesOrder.value.filter((noteKey)=>!keysArray.includes(noteKey));
                return ({tagKey:notesOrder.tagKey, value:newNotesOrderValue});
            });
            resolve(this.getNotes());
        }
    }); 
}
sendNoteToTrashViejo(key){
    return new Promise((resolve,reject)=>{
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME,this.CONFIG_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME); 
        
        let updateRequest = objectStore.get(key);
        let note = null;
        updateRequest.onsuccess = event =>{
            note = event.target.result;
            note.state = 'trash';
            //note.lastModifyDate = Date.now();
            objectStore.put(note,key);
        }

        let requestNotesOrderConfig = configObjectStore.get('notesOrder');
        let newNotesOrder = [...this.notesOrderCache];
        const indexToRemove = newNotesOrder.indexOf(key);
        newNotesOrder = [...newNotesOrder.slice(0, indexToRemove),...newNotesOrder.slice(indexToRemove+1)];

        requestNotesOrderConfig.onsuccess = event=>{
            let data = event.target.result;
            data.value = newNotesOrder; 
            configObjectStore.put(data);
        }

        transaction.onerror = event => {console.log(`ERROR: Fail at sending a note to trash can. ${event}`);};
        transaction.oncomplete = event=>{
            this.notesOrderCache = [...newNotesOrder];

            const noteIndex = this.allNotesCache.findIndex((note)=>note.key === key);
            this.allNotesCache[noteIndex].state = 'trash';
            this.allNotesCache = [...this.allNotesCache];
            
            resolve(this.getNotes());
        }
    }); 
}
restoreNoteviejoo(key){
    return new Promise((resolve,reject)=>{
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME,this.CONFIG_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME); 
        
        let updateRequest = objectStore.get(key);
        let note = null;
        updateRequest.onsuccess = event =>{
            note = event.target.result;
            note.state = 'listed';
            //note.lastModifyDate = Date.now();
            objectStore.put(note,key);
        }

        let requestNotesOrderConfig = configObjectStore.get('notesOrder');
        let newNotesOrder = [key,...this.notesOrderCache];
        requestNotesOrderConfig.onsuccess = event=>{
            let data = event.target.result;
            data.value = newNotesOrder; 
            configObjectStore.put(data);
        }

        transaction.onerror = event => {console.log(`ERROR: Fail at restoring a note from the trash can. ${event}`);};
        transaction.oncomplete = event=>{
            this.notesOrderCache = [...newNotesOrder];

            const noteIndex = this.allNotesCache.findIndex((note)=>note.key === key);
            this.allNotesCache[noteIndex].state = 'listed';
            this.allNotesCache = [...this.allNotesCache];
            
            resolve(this.getTrashedNotes());
        }
    }); 
}
restoreNote(key){
    return this.restoreNotes([key]);
}
restoreNotes(keysArray){
    return new Promise((resolve,reject)=>{
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME,this.CONFIG_OBJECTSTORE_NAME,this.NOTESORDERBYTAG_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME); 
        let notesOrderByTagObjectStore = transaction.objectStore(this.NOTESORDERBYTAG_OBJECTSTORE_NAME);
       
        keysArray.forEach((key)=>{
            let updateRequest = objectStore.get(key);
            let note = null;
            updateRequest.onsuccess = event =>{
                note = event.target.result;
                note.state = 'listed';
                //note.lastModifyDate = Date.now();
                objectStore.put(note,key);
            }
        });

        let requestNotesOrderConfig = configObjectStore.get('notesOrder');
        let newNotesOrder = [...this.notesOrderCache,...keysArray];
        requestNotesOrderConfig.onsuccess = event=>{
            let data = event.target.result;
            data.value = newNotesOrder; 
            configObjectStore.put(data);
        }

        //{tagKey1: [noteKey45, noteKey64], tagKey22:[noteKey64], ...}
        const notesOrderByTagToUpdate = keysArray.reduce ((acc,noteKey)=>{
            const note = this.allNotesCache.find((aNote)=>aNote.key === noteKey);
            const noteTags = note.noteTags;

            for (let tagKey of noteTags){
                acc = acc[tagKey]? {...acc,[tagKey]:[noteKey,...acc[tagKey]]} : {...acc, [tagKey]:[noteKey]} ;
            }
            return {...acc};
        },{});

        console.log(notesOrderByTagToUpdate);
        //Updating notesOrderByTag 
        for (const tagKey in notesOrderByTagToUpdate){
            let notesOrderByTagRequest =  notesOrderByTagObjectStore.get(parseInt(tagKey)); 
            notesOrderByTagRequest.onsuccess = event=>{
                let notesOrderByTag = event.target.result; 
                notesOrderByTag.value = [...notesOrderByTag.value,...notesOrderByTagToUpdate[tagKey]];
                notesOrderByTagObjectStore.put(notesOrderByTag); 
            }
        }

        transaction.onerror = event => {console.log(`ERROR: Fail at restoring notes from the trash can. ${event}`);};
        transaction.oncomplete = event=>{
            this.notesOrderCache = [...newNotesOrder];
            //update allNotesCache
            this.allNotesCache = this.allNotesCache.map((note)=>{
                if(keysArray.includes(note.key))
                    return {...note, state:'listed'};
                else
                    return note;
            });

            //updating notesOrderByTagCache
            const tagsToUpdate = Object.keys(notesOrderByTagToUpdate).map((tagKeyString)=>parseInt(tagKeyString)); 
            console.log("tagsToUpdate",tagsToUpdate);

            this.notesOrderByTagCache = this.notesOrderByTagCache.map((notesOrder)=>{
                if (tagsToUpdate.includes(notesOrder.tagKey)){
                    let newNotesOrderValue = [...notesOrder.value,...notesOrderByTagToUpdate[(notesOrder.tagKey)]];
                    return ({tagKey:notesOrder.tagKey, value:newNotesOrderValue});
                }
                return notesOrder;
            });

            resolve(this.getTrashedNotes());
        }
    }); 
}

deleteNote(key){
    return this.deleteNotes([key]);
}
deleteNotes(keysArray){
    return new Promise((resolve,reject)=>{
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME,this.CONFIG_OBJECTSTORE_NAME,this.NOTESORDERBYTAG_OBJECTSTORE_NAME], "readwrite");
        let objectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let configObjectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME); 
        let notesOrderByTagObjectStore = transaction.objectStore(this.NOTESORDERBYTAG_OBJECTSTORE_NAME);
        
        keysArray.forEach((key)=>{
            let deleteRequest = objectStore.delete(key);
        });

        //En el flujo normal esto no pasa, porque la nota del basurero,YA fue sacada del notesOrder.....
        let requestNotesOrderConfig = configObjectStore.get('notesOrder');
        let newNotesOrder = this.notesOrderCache.filter((key)=> !keysArray.includes(key))
        requestNotesOrderConfig.onsuccess = event=>{
            let data = event.target.result;
            data.value = newNotesOrder; 
            configObjectStore.put(data);
        }

        //Updating notesOrderByTag 
        let notesOrderByTagRequestKeys =  notesOrderByTagObjectStore.getAllKeys(); 
        notesOrderByTagRequestKeys.onsuccess = event =>{
            let allNotesOrderByTagsKeys = event.target.result;
            for (let notesOrderByTagKey of allNotesOrderByTagsKeys){
                let notesOrderByTagRequest =  notesOrderByTagObjectStore.get(notesOrderByTagKey); 
                notesOrderByTagRequest.onsuccess = event =>{
                    let notesOrderByTag = event.target.result;
                    let newNotesOrderByTagValue= notesOrderByTag.value.filter((noteKey)=>!keysArray.includes(noteKey));
                    notesOrderByTag.value = newNotesOrderByTagValue;
                    notesOrderByTagObjectStore.put(notesOrderByTag); 
                }
            }   
        }

        transaction.onerror = event => {console.log(`ERROR: Fail at sending a note to trash can. ${event}`);};
        transaction.oncomplete = event=>{
            this.notesOrderCache = [...newNotesOrder];
            this.allNotesCache = this.allNotesCache.filter((note)=>{
                return !keysArray.includes(note.key);
            })
            //updating notesOrderByTagCache
            this.notesOrderByTagCache = this.notesOrderByTagCache.map((notesOrder)=>{
                let newNotesOrderValue = notesOrder.value.filter((noteKey)=>!keysArray.includes(noteKey));
                return ({tagKey:notesOrder.tagKey, value:newNotesOrderValue});
            });

            console.log("notesOderBtTagCache luego de eliminar:",this.notesOrderByTagCache);
            // resolve(this.getNotes());
            resolve(this.getTrashedNotes());
        }
    }); 
}

deleteNoteViejo(key){
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
getNotesFilteredByTag(tagKey){
    const orderArray = this.notesOrderByTagCache.find((notesOrder)=>notesOrder.tagKey === tagKey).value;
    const notesFilteredByTag = this.allNotesCache.filter((note)=>{ return (note.state==='listed' && note.noteTags.includes(tagKey));});
    return this.sortNotes(notesFilteredByTag,orderArray);
}
getTrashedNotes(){
    const trashedNotes = this.allNotesCache.filter((note)=>note.state==='trash');
    return trashedNotes;
}
//Este reorder ahora va a ser distinto, va a depender de si son todas las notes o las si estamos viendo un Tag.
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

reorderNotesFilteredByTag (sourceKey,destinationKey,tagKey){
    console.log(`reorderNotesFilterderByTag: sourceKey:${sourceKey} destinationKey:${destinationKey} tagKey:${tagKey}`);
    const index = this.notesOrderByTagCache.findIndex((e)=>e.tagKey === tagKey);
    const reorderedNotesByTag = [...this.notesOrderByTagCache.find((e)=>e.tagKey === tagKey).value];

    //reordering notesOrderByTag array
    reorderedNotesByTag.splice(
        reorderedNotesByTag.indexOf(destinationKey),
        0,
        reorderedNotesByTag.splice(reorderedNotesByTag.indexOf(sourceKey),1)[0]);

    console.log(reorderedNotesByTag);   
    //replacing the object with the new one
    this.notesOrderByTagCache = [...this.notesOrderByTagCache.slice(0,index),
        {tagKey:tagKey, value:[...reorderedNotesByTag]},
        ...this.notesOrderByTagCache.slice(index+1)]; 
        
    console.log(this.notesOrderByTagCache);


    //asynchronously update the notesOrderByTag in the DB.
    let transaction = this.DBConecction.transaction([this.NOTESORDERBYTAG_OBJECTSTORE_NAME], "readwrite");
    let notesOrderByTagObjectStore = transaction.objectStore(this.NOTESORDERBYTAG_OBJECTSTORE_NAME); 
    let notesOrderByTagRequest = notesOrderByTagObjectStore.get(tagKey);
    notesOrderByTagRequest.onsuccess = event=>{
        let data = event.target.result;
        data.value = reorderedNotesByTag; 
        notesOrderByTagObjectStore.put(data);
    }
    transaction.onerror = event => {console.log(`ERROR: Fail at save new order of notes. ${event}`);};
    transaction.oncomplete = event => { };
    
    return (this.getNotesFilteredByTag(tagKey));
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
searchNotes(term, appView){
    term = term.trim();
    if (term===''){
        if (appView.view === 'default')
            return (this.getNotes());
        if (appView.view === 'trash')
            return (this.getTrashedNotes());
        if (appView.view === 'tagFiltered')
            return (this.getNotesFilteredByTag(appView.tagFilter)); //Como saco el appView.tagFilter?
    }

    const result = this.fuse.search(term);
    const notesResult = result.map((result)=>result.item);
    if (appView.view === 'default')
            return  notesResult.filter((note)=> note.state === 'listed') ;
    if (appView.view === 'trash')
            return  notesResult.filter((note)=> note.state === 'trash') ;
    if (appView.view === 'tagFiltered')
            return  notesResult.filter((note)=> note.noteTags.includes(appView.tagFilter) && note.state === 'listed') ;

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
        let transaction = this.DBConecction.transaction([this.TAGS_OBJECTSTORE_NAME,this.NOTESORDERBYTAG_OBJECTSTORE_NAME], "readwrite");
        let objectStoreTags = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME);
        let objectStoreNotesOrderByTag = transaction.objectStore(this.NOTESORDERBYTAG_OBJECTSTORE_NAME);
        let newTags_To_Cache = [];
        let newTags_To_NotesOrderByTag = [];

        for (let newTag of newTags){
            let addRequest = objectStoreTags.add({name:newTag.name});
            addRequest.onsuccess = e=>{
                let newKey = e.target.result;
                newTags_To_Cache.push({key:newKey, name:newTag.name});
                //Now create notesOrderByTag element:
                let addNotesOrderByTagRequest = objectStoreNotesOrderByTag.add({tagKey:newKey, value:[]});
                addNotesOrderByTagRequest.onsuccess = e=>{
                    newTags_To_NotesOrderByTag.push({tagKey:newKey, value:[]});
                }
            }
            addRequest.onerror = e=>{console.log(`ERROR: Impossible to save the new tag: ${newTag}. Abort all tags saving. ${e}`)};
        }
       
        transaction.oncomplete = event=>{
            this.allTagsCache = [...this.sortTags([...newTags_To_Cache,...this.allTagsCache])];
            this.notesOrderByTagCache = [...newTags_To_NotesOrderByTag, ...this.notesOrderByTagCache];
            resolve(this.allTagsCache);
        }
    });
}
deleteTags(tagsToDelete){//tagToDelete contiene las keys de los tags a eliminar ej: [1,2,5,663,23]
    return new Promise((resolve,reject)=>{
        const tagsKeysToDelete = tagsToDelete.map(tagToDelete => tagToDelete.key);
        let transaction = this.DBConecction.transaction([this.NOTES_OBJECTSTORE_NAME,this.TAGS_OBJECTSTORE_NAME,this.NOTESORDERBYTAG_OBJECTSTORE_NAME], "readwrite");
        let notesObjectStore = transaction.objectStore(this.NOTES_OBJECTSTORE_NAME); 
        let tagsObjectStore = transaction.objectStore(this.TAGS_OBJECTSTORE_NAME);
        let notesOrderByTagObjectStore = transaction.objectStore(this.NOTESORDERBYTAG_OBJECTSTORE_NAME);

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
        tagsKeysToDelete.forEach((tagKeyToDelete)=>{
            let deleteTagRequest = tagsObjectStore.delete(tagKeyToDelete);
            deleteTagRequest.onerror = e=>{console.log(`ERROR: Cant delete tag with key: ${tagKeyToDelete}. ${e}`);}
        });

        //delete notesOrderByTag from db
        tagsKeysToDelete.forEach((tagKeyToDelete)=>{
            let deleteNotesOrderByTagRequest = notesOrderByTagObjectStore.delete(tagKeyToDelete);
            deleteNotesOrderByTagRequest.onerror = e=>{console.log(`ERROR: Cant delete NotesOrderByTag with key: ${tagKeyToDelete}. ${e}`);}
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

            this.notesOrderByTagCache = this.notesOrderByTagCache.filter((notesOrder)=>!tagsKeysToDelete.includes(notesOrder.tagKey));
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

////////////////////LONG-PRESS-EVENT (https://github.com/john-doherty/long-press-event) //////////////////////////
/*
// the event bubbles, so you can listen at the root level
document.addEventListener('long-press', function(e) {
    //IMPORTANTE: Si esto lo hago en NoteList.js (en </NoteCard>) No hace falta ponerlo aca!. Cada NoteCard tendria su propio eventListener....
    //Con respecto a en que parte se hace el click en la noteCard, se pueden hacer 2 cosas aca: 
    //1) NO ANDA BIEN Dejar que el evento suba con Bubbling y simplemente aca preguntamos si e.target.matches('.note-card-container') obtenemos su id con los dataset y ahi lo que querramos.
    //   El método element.matches('cssSelector') comprueba si el Element sería seleccionable por el selector CSS especificado en la cadena; en caso contrario, retorna false.
    //   Este no andaria bien, porque si hacemos click en un elemento interno, obviamente matches no va a andar, tendria que tener un matches con muchas cosas... mejor el 2)
    //2) Usar e.target.closest('.note-card-container') para obtener el elemento note-card-container mas cercano al disparo del evento, y obtenemos su id con los dataset y ahi lo que querramos.
    
    console.log(e);
    const element = e.target;
    const elementCardContainer = element.closest('.note-card-container');//el elemento mas cercano de forma ascendiente o el mismo que cumpla con el selector.
    if(elementCardContainer){
     const noteKey = elementCardContainer.dataset.noteKey;
     console.log(`*Abro el editor para la noteId:${noteKey} , y prevengo default click event*`);
     e.preventDefault();// o e.stopPropagation();?
    }
  });
  */
////////////////////LONG-PRESS-EVENT//////////////////////////

////////////////////CLIPBOARDJS (clipboardjs.com)///////////////////////////////////
// const clipboard = new ClipboardJS('.card-container');
const clipboard = new ClipboardJS('.note-card-container', {
    text: function(trigger) {
        const noteKey = parseInt(trigger.dataset.noteKey);
        return AppData.getNoteTextByKey(noteKey);
    }
});
clipboard.on('success', function(e) {
    console.log(`Se Copio: ${(e.text)}`);
    e.clearSelection();
});
clipboard.on('error', function(e) {
    console.error('Action:', e.action);
    console.error('Trigger:', e.trigger);
});
////////////////////CLIPBOARDJS///////////////////////////////////