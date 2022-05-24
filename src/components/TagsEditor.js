import { Context } from "./Copi";
import { useContext,memo,useState, useReducer, useEffect } from "react";
import {AppData} from "../data/Data2";
import Modal from "./Modal";


const TagInput =memo((props)=>{
    const {tagName,tagChangeHandler} = props;
    const [value,setValue] = useState(tagName);
    const onChangeHandler=(value)=>{
        setValue(value);
        tagChangeHandler(value);
    }
    return(
        <input className="input flexGrow_high flexGrow_high" type="text" value={value} onChange={(e)=>onChangeHandler(e.target.value)}></input>
        )
});

const TagInputCreator = (props)=>{
    const {saveTagHandler,allTags} = props;
    const [term,setTerm] = useState('');

    let buttonIsDisabled = false;
    allTags.forEach(tag => {
        if(tag.name === term)
            buttonIsDisabled = true;
    }); 

    return(
        <div className="tagAddContainer">

            <input className="input flexGrow_high" type='text' name='addTagInput' onChange={(e)=>{
                setTerm(e.target.value);
            }}/>
            <button className="iconButton" onClick={()=>{saveTagHandler(term)}} disabled={buttonIsDisabled}> 
                <img className= {`icon ${buttonIsDisabled?'icon-disabled':''}`} src="/assets/add.svg" alt="addtag" />
            </button>
        
        </div>
    )
}

//En la BD el orden debe ser delete then create then update
//[
//action ={type: 'delete', payload:{localKey:1, id:12, name:'cocina'} },
//action ={type: 'create', payload:{localKey:13, name:'newTagName'} },
//action ={type: 'update', payload:{key:5, name:'updatedTagName'} },
//action ={type: 'update', payload:{localKey:8 , name:'updatedTagName'} },
//no esta.
//]
//Si Creo y luego actualizo, solo se debe quedar la payload de Crear (si estoy en update, y no tiene id, se genera una payload de create.)

const tagsChangerReducer = (changesActions,action)=> {
    switch(action.type){
        case 'delete':{//busco por localKey=> Si es 'create', directamente lo saco. Si era 'update' con id, entonces le remplazo el type por 'delete'
            //Si no esta, hay q crearlo (va a ser con id si o si)
            let index = 0;
            let lastChange = null;
            for (let changeAction of changesActions){
               if( changeAction.payload.key === action.payload.key){
                   lastChange = changeAction;
                   break;
               }
               index++;
            }

            if (lastChange){
               if(lastChange.type ==='create')
                    return [...changesActions.slice(0,index),...changesActions.slice(index+1)]; 
               if(lastChange.type === 'update'){
                //    lastChange.type = 'delete'; //No se porque asi petaba....
                //    return [...changesState];
                   return [...changesActions.slice(0,index),
                    {type:'delete', payload:{key:lastChange.payload.key, name:lastChange.payload.name}},
                    ...changesActions.slice(index+1)]; 

               }
            }else{
                return ([action,...changesActions]);
            }
            

        }break;

        case 'update':{ //buscas por key=> Si es create o update, solo le cambias el name. Si no existe, lo creas con update.
            //action ={type: 'update', payload:{key:5, name:'updatedTagName'} },
            let lastChange = null;
            for (let changeAction of changesActions){
               if( changeAction.payload.key === action.payload.key){
                   lastChange = changeAction;
                   break;
               }
            }
            if (lastChange!== null && (lastChange.type === 'create' || lastChange.type === 'update') ){
                lastChange.payload.name = action.payload.name;
                return [...changesActions];
            }
            return ([action,...changesActions]);
        }

        case 'create':{
            // tendria que chequear que el nuevo nombre sea compatible.... (no se deberia dejar directamente en la interfaz....)
            return ([action,...changesActions]);
        }
        default:
            return changesActions
    }
}

let localKeyId = 0; //Id negativas que se usan provisoriamente para los nuevos tags creados en esta pantalla....

const TagsEditor=()=>{
        const {setAppView,appView,setNoteList} = useContext(Context);
        const [allTagsLocal,setAllTagsLocal] = useState(AppData.allTagsCache); // { [{key:0, name:'cocina'},{key:10, name:'perros},...]
        const [tagsChanges,dispatchTagsChanges] = useReducer(tagsChangerReducer,[]);
        const [modalView,setModalView] = useState({show:false});
        console.log("alltagslocal",allTagsLocal); 
        const updateTagNameHandler = (localTag,newTagName)=>{
            dispatchTagsChanges({type:'update', payload:{...localTag, name:newTagName}}); //{type:'update' , payload:{{key:2,name:'newName'}} }
            const index = allTagsLocal.findIndex ((tag)=>{ return tag.key === localTag.key });
            setAllTagsLocal( [...allTagsLocal.slice(0,index),{...localTag,name:newTagName},...allTagsLocal.slice(index+1)] );
        }
        const deleteTagHandler = (localTag) => {
            dispatchTagsChanges({type:'delete', payload:{...localTag} });
            const index = allTagsLocal.findIndex ((tag)=>{ return tag.key === localTag.key });
            setAllTagsLocal( [...allTagsLocal.slice(0,index),...allTagsLocal.slice(index+1)] );
        } 
        const createNewTagHandler=(newTagName)=>{
            const payload ={key:--localKeyId, name:newTagName} 
            dispatchTagsChanges({type:'create', payload: payload });
            setAllTagsLocal([...allTagsLocal, payload]); // quiza tendria que ordenar.
        }
        const saveChangesHandler = ()=>{
            //Aca tendria que checkear que todos los 'name' sean distintos... (con la treta de new Set(tagsChanges))
            AppData.applyTagsChanges(tagsChanges).then((r)=>{
                if(appView.view ==='tagFiltered' && AppData.existTagWithKey(appView.tagFilter) ){
                    setAppView({...appView,tagsEditor:false});
                    setNoteList(AppData.getNotesFilteredByTag(appView.tagFilter));
                }else{
                    setAppView({...appView,view:'default', tagsEditor:false});
                    setNoteList(AppData.getNotes());
                }
            });
                
        }
        const closeModal=()=>{
            setModalView({show:false});
        }
        const shouldDisableSaveButton=()=>{
            const onlyTagNamesArray = allTagsLocal.map(t=>t.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, ""));
            const noDupSet = new Set(onlyTagNamesArray);
            const hasBlankTags = !onlyTagNamesArray.every(t=>t.trim().length > 0);
            const areTagsRepeated = (onlyTagNamesArray.length !== noDupSet.size)
            return ( areTagsRepeated || hasBlankTags);
        }

        return(
            <div className="tagsEditor">
            {modalView.show
            ?<Modal 
                acceptHandler={modalView.acceptHandler}
                cancelHandler={modalView.cancelHandler}
                modalText={modalView.modalText}
                classNames={modalView.classNames}
            />
            :null}
            <div className="viewHeader">
                <button className="iconButton" onClick={()=>{saveChangesHandler(); setAppView({...appView, tagsEditor:false, sidePanel:true})}} disabled={shouldDisableSaveButton()}>
                    <img className={`icon ${shouldDisableSaveButton()? 'icon-disabled':''}`} src="/assets/arrow_back.svg" alt="back" />
                </button>
                <div className="sidePanelHeaders" style={ {display:"flex", justifyContent:"center", fontSize:"1.4rem" }} >Edit tags</div>
            </div>
            <hr/>
            <TagInputCreator saveTagHandler={createNewTagHandler} allTags={allTagsLocal}/>
            <hr/>
            {
                allTagsLocal.map((tag)=>{
                    return(
                    <div key={tag.key} className="tagsListItem" >
                        <img className="icon" src="/assets/label.svg" alt="label" />

                        <TagInput tagName={tag.name} tagChangeHandler={(newTagName)=>{updateTagNameHandler(tag,newTagName)} }/>

                        <button className="iconButton" onClick={()=>{
                            setModalView({
                                show:true,
                                acceptHandler:()=>{deleteTagHandler(tag)},
                                cancelHandler:()=>{closeModal()},
                                modalText:`Delete tag: ${tag.name} ?`,
                                classNames:'',
                            });
                        }}>
                            <img className="icon " src="/assets/trashCan.svg" alt="trashcan" />
                        </button> 
                        
                    </div>
                )}
                )
            }
        </div>
    )
}

const TagsEditorContainer = ()=>{
    const {appView} = useContext(Context);
    // return(<>{(appView.view === 'tagsEditor')?<TagsEditor />:null}</>);
    return(<>{appView.tagsEditor? <TagsEditor/> :null}</>);
}
export default TagsEditorContainer;


/*
Consideraciones de tags:
- los tags no pueden editarse para ser vacios ('') o espacioes en blanco (' ', '     ');
- los tags no pueden editarse para ser igual a otro tag: tag,tag2 -> tag,tag .
*/