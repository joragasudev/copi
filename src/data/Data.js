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
        this.DBNAME = 'Copi-App';
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
        this.MAX_TEXT_LENGTH = 20;

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

//Every method that modify the DB, must also update the cache structures.
//-------------HELPERS--------------
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
truncateText(text,max){
    let maxLength = max? max : this.MAX_TEXT_LENGTH;
    return text.length <= maxLength? text : text.substring(0,maxLength)+'...';
}
//-------------NOTES-----------------
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
            this.fuse.setCollection(this.allNotesCache); 
            
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

        const notesOrderByTagToUpdate = keysArray.reduce ((acc,noteKey)=>{
            const note = this.allNotesCache.find((aNote)=>aNote.key === noteKey);
            const noteTags = note.noteTags;

            for (let tagKey of noteTags){
                acc = acc[tagKey]? {...acc,[tagKey]:[noteKey,...acc[tagKey]]} : {...acc, [tagKey]:[noteKey]} ;
            }
            return {...acc};
        },{});

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

            resolve(this.getTrashedNotes());
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
    const index = this.notesOrderByTagCache.findIndex((e)=>e.tagKey === tagKey);
    const reorderedNotesByTag = [...this.notesOrderByTagCache.find((e)=>e.tagKey === tagKey).value];

    //reordering notesOrderByTag array
    reorderedNotesByTag.splice(
        reorderedNotesByTag.indexOf(destinationKey),
        0,
        reorderedNotesByTag.splice(reorderedNotesByTag.indexOf(sourceKey),1)[0]);

    //replacing the object with the new one
    this.notesOrderByTagCache = [...this.notesOrderByTagCache.slice(0,index),
        {tagKey:tagKey, value:[...reorderedNotesByTag]},
        ...this.notesOrderByTagCache.slice(index+1)]; 
        
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
searchNotes(term, appView){
    term = term.trim();
    if (term===''){
        if (appView.view === 'default')
            return (this.getNotes());
        if (appView.view === 'trash')
            return (this.getTrashedNotes());
        if (appView.view === 'tagFiltered')
            return (this.getNotesFilteredByTag(appView.tagFilter)); 
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
deleteTags(tagsToDelete){
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

        //Search in cache only affected notes for optimization..
        const notesToEdit = this.allNotesCache.filter((note)=>includesTagsToDelete(note.noteTags,tagsKeysToDelete))
        notesToEdit.forEach((note)=>{
            let updateNoteRequest = notesObjectStore.get(note.key);
            updateNoteRequest.onsuccess = event=>{
                let retrievedNote = event.target.result;
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
updateTags(tagsToUpdate){
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
getTagName(key){
    const theTag = this.allTagsCache.find((tag)=>tag.key === key);
    return theTag.name;
}
existTagWithKey(key){
    const theTag = this.allTagsCache.find((tag)=>tag.key === key);
    return theTag!==undefined;
}

/*Experimiental PWA Installation 
async promptInstallApp(){
    console.log('deferredPrompt es: ', deferredPrompt);
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('outcome es:', outcome);
        if (outcome === 'accepted') {
            deferredPrompt = null;
        }
    }
}
isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
isAppInstalled(){
    console.log(navigator.getInstalledRelatedApps());
}
installApp(){
    //Experimental does not work
    let e = new window.BeforeInstallPromptEvent('instalar', {
        view: window,
        bubbles: true,
        cancelable: true
      });
    window.dispatchEvent(e);
}
*/

}//end class Data
export const AppData = new Data();



////////////////////CLIPBOARDJS (clipboardjs.com)//////////////////
// const clipboard = new ClipboardJS('.card-container');
const clipboard = new ClipboardJS('.noteCardContainer', {
    text: function(trigger) {
        const noteKey = parseInt(trigger.dataset.noteKey);
        return AppData.getNoteTextByKey(noteKey);
    }
});
clipboard.on('success', function(e) {
    // console.log('Event object:',e);
    // console.log(`Copied: ${(e.text)}`);
    e.clearSelection();
});
clipboard.on('error', function(e) {
    console.log('Error event object:',e);
    console.error('Action:', e.action);
    console.error('Trigger:', e.trigger);
});
////////////////////CLIPBOARDJS///////////////////////////////////

/*Experimental PWA installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Previene a la mini barra de informaci??n que aparezca en smartphones
    //e.preventDefault();
    // Guarda el evento para que se dispare m??s tarde
    deferredPrompt = e;
    // Actualizar la IU para notificarle al usuario que se puede instalar tu PWA
    //showInstallPromotion();
    // De manera opcional, env??a el evento de anal??ticos para saber si se mostr?? la promoci??n a a instalaci??n del PWA
    console.log(`'beforeinstallprompt' event was fired.`,e);
});*/