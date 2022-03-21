/*
getAllTagsAvailableOld(){
        return new Promise((resolve,reject)=>{
            let transaction = this.connection.transaction([this.CONFIG_OBJECTSTORE_NAME], "readonly");
            let objectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME);
            let getTagsRequest = objectStore.get('allTagsAvailable');
            getTagsRequest.onsuccess = event =>{
                resolve(event.target.result.value);
            }
        });
    }
    addNewTagOld(newTag){
        return new Promise((resolve,reject)=>{
            if(!this.allTagsAvailable.includes(newTag)){
                let transaction = this.connection.transaction([this.CONFIG_OBJECTSTORE_NAME], "readwrite");
                let objectStore = transaction.objectStore(this.CONFIG_OBJECTSTORE_NAME); 
                let updateRequest = objectStore.get('allTagsAvailable');
                updateRequest.onsuccess = event =>{
                    let result = event.target.result; 
                    let allTagsAvailable = result.value;
                    allTagsAvailable.push(newTag);
                    allTagsAvailable.sort();
                    this.allTagsAvailable = allTagsAvailable;
                    let putNewTagRequest = objectStore.put(result);
                    putNewTagRequest.onsuccess = e=>{
                        resolve();
                    }
                }
            }else{
                resolve();
            }
        });
    }
*/