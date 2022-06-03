import { Context } from "./Copi";
import { useContext,memo,useState, useReducer } from "react";
import {AppData} from "../data/Data";
import { ModalBackground } from "./Modal";
import Modal from "./Modal"


const TagInput = memo((props)=>{
    const {tagName,tagChangeHandler} = props;
    const [value,setValue] = useState(tagName);
    const onChangeHandler=(value)=>{
        setValue(value);
        tagChangeHandler(value);
    }
    return(<input className="input flexGrow_high flexGrow_high" type="text" value={value} onChange={(e)=>onChangeHandler(e.target.value)}></input>);
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
            <input className="input flexGrow_high" autoComplete="off" type='text' name='addTagInput' onChange={(e)=>{
                setTerm(e.target.value);
            }}/>
            <button className="iconButton" onClick={()=>{saveTagHandler(term)}} disabled={buttonIsDisabled}> 
                <img className= {`icon ${buttonIsDisabled?'icon--disabled':''}`} src="/assets/add.svg" alt="addtag" />
            </button>
        </div>
    )
}


//tagsChangerReducer generates an array with the changes that has to be applied to the tags table in the DB.
const tagsChangerReducer = (changesActions,action)=> {
    switch(action.type){
        case 'delete':{
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
                   return [...changesActions.slice(0,index),
                    {type:'delete', payload:{key:lastChange.payload.key, name:lastChange.payload.name}},
                    ...changesActions.slice(index+1)]; 
               }
            }else{
                return ([action,...changesActions]);
            }
        }break;

        case 'update':{ 
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
            return ([action,...changesActions]);
        }

        default:
            return changesActions
    }
}


//Fake negatives ids are created when you type a new tag to use as react key in collections.
//This is so because a new tag that has not yet been saved in the DB does not have an id yet.
let localKeyId = 0;

const TagsEditor=()=>{
        const {setAppView,appView,setNoteList} = useContext(Context);
        const [allTagsLocal,setAllTagsLocal] = useState(AppData.allTagsCache);
        const [tagsChanges,dispatchTagsChanges] = useReducer(tagsChangerReducer,[]);
        const [modalView,setModalView] = useState({show:false});
        
        const updateTagNameHandler = (localTag,newTagName)=>{
            dispatchTagsChanges({type:'update', payload:{...localTag, name:newTagName}});
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
            setAllTagsLocal([...allTagsLocal, payload]); 
        }
        const saveChangesHandler = ()=>{
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
            <>
            {appView.sidePanel && <ModalBackground classNames={"modalBackground--tagsEditor"} cancelHandler={()=>{setAppView({...appView,tagsEditor:false});}}/>}
            
            <div className="tagsEditor">
                
                {modalView.show &&
                <Modal 
                    acceptHandler={modalView.acceptHandler}
                    cancelHandler={modalView.cancelHandler}
                    modalText={modalView.modalText}
                    classNames={modalView.classNames}
                />}

                <div className="viewHeader">
                    <button className="iconButton" onClick={()=>{saveChangesHandler(); setAppView({...appView, tagsEditor:false, sidePanel:true})}} disabled={shouldDisableSaveButton()}>
                        <img className={`icon ${shouldDisableSaveButton()? 'icon--disabled':''}`} src="/assets/arrow_back.svg" alt="back" />
                    </button>
                    <div className="viewHeader__title">Edit tags</div>
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
        </>
    )
}

export default TagsEditor;
