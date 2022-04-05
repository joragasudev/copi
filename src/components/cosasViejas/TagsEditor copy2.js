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
        <input type="text" value={value} onChange={(e)=>onChangeHandler(e.target.value)}></input>
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
        <>
            <input type='text' name='addTagInput' onChange={(e)=>{
                setTerm(e.target.value);
            }}/>
             <button onClick={()=>{saveTagHandler(term)}} disabled={buttonIsDisabled}> + </button>
        </>
    )
}

//En la BD el orden debe ser delete then create then update
//[
//action ={type: 'delete', payload:{localKey:1, id:12, name:'cocina'} },
//action ={type: 'create', payload:{localKey:13, name:'newTagName'} },
//action ={type: 'update', payload:{localKey:5 ,id:3 , name:'updatedTagName'} },
//action ={type: 'update', payload:{localKey:8 , name:'updatedTagName'} },
//no esta.
//]
//Si Creo y luego actualizo, solo se debe quedar la payload de Crear (si estoy en update, y no tiene id, se genera una payload de create.)

const tagsChangerReducer = (changesState,action)=> {
    switch(action.type){
        case 'delete':{//busco por localKey=> Si es 'create', directamente lo saco. Si era 'update' con id, entonces le remplazo el type por 'delete'
            //Si no esta, hay q crearlo (va a ser con id si o si)
            let index = 0;
            let lastChange = null;
            for (let change of changesState){
               if( change.payload.localKey === action.payload.localKey){
                   lastChange = change;
                   break;
               }
               index++;
            }

            if (lastChange){
               if(lastChange.type ==='create')
                    return [...changesState.slice(0,index),...changesState.slice(index+1)]; 
               if(lastChange.type === 'update'){
                //    lastChange.type = 'delete'; //No se porque asi petaba....
                //    return [...changesState];
                   return [...changesState.slice(0,index),
                    {type:'delete', payload:{localKey:lastChange.payload.localKey, id:lastChange.payload.id, name:lastChange.payload.name}},
                    ...changesState.slice(index+1)]; 

               }
            }else{
                return ([action,...changesState]);
            }
            

        }break;

        case 'update':{ //buscas por localKey=> Si es create o update, solo le cambias el name. Si no existe, lo creas con update.
            let lastChange = null;
            for (let change of changesState){
               if( change.payload.localKey === action.payload.localKey){
                   lastChange = change;
                   break;
               }
            }
            if (lastChange!== null && (lastChange.type === 'create' || lastChange.type === 'update') ){
                lastChange.payload.name = action.payload.name;
                return [...changesState];
            }
            return ([action,...changesState]);
        }

        case 'create':{
            // tendria que chequear que el nuevo nombre sea compatible.... (no se deberia dejar directamente en la interfaz....)
            return ([action,...changesState]);
        }
        default:
            return changesState
    }
}

let localKeyId=0;
const allTagsWithLocalKeys=()=>{
    return NoteData.allTagsAvailable.map((tag)=>{
        return {localKey:++localKeyId, ...tag};
    })
}
const TagsEditor=()=>{
        const {toggleTagsEditor} = useContext(Context);
        const [allTagsLocal,setAllTagsLocal] = useState(allTagsWithLocalKeys()); // { [{localkey:0, id:3, name:'cocina'},{localkey:1, id:10, name:'perros},...]
        const [tagsChanges,dispatchTagsChanges] = useReducer(tagsChangerReducer,[]);
        const [modalView,setModalView] = useState({show:false});
        
        console.log(tagsChanges);
        
        const updateTagNameHandler = (localTag,newTagName)=>{
            dispatchTagsChanges({type:'update', payload:{...localTag, name:newTagName}});
            //ojo con estas dos lineas, pueden petarla?:
            const index = allTagsLocal.findIndex ((element)=>{ return element.localKey.toString() === localTag.localKey.toString() });
            setAllTagsLocal( [...allTagsLocal.slice(0,index),{...localTag,name:newTagName},...allTagsLocal.slice(index+1)] );
        }
        const deleteTagHandler = (localTag) => {
            dispatchTagsChanges({type:'delete', payload:{...localTag} });
            const index = allTagsLocal.findIndex ((element)=>{ return element.localKey.toString() === localTag.localKey.toString() });
            setAllTagsLocal( [...allTagsLocal.slice(0,index),...allTagsLocal.slice(index+1)] );
        } 
        const createNewTagHandler=(newTagName)=>{
            const payload ={localKey:++localKeyId, name:newTagName} 
            dispatchTagsChanges({type:'create', payload: payload });
            setAllTagsLocal([...allTagsLocal, payload]); // quiza tendria que ordenar.
        }
        
        const closeModal=()=>{
            setModalView({show:false});
        }
        const shouldDisableSaveButton=()=>{
            const onlyTagNamesArray = allTagsLocal.map(t=>t.name);
            const noDupSet = new Set(onlyTagNamesArray);
            const hasBlankTags = !onlyTagNamesArray.every(t=>t.trim().length > 0);
            const areTagsRepeated = (onlyTagNamesArray.length !== noDupSet.size)
            return ( areTagsRepeated || hasBlankTags);
        }
        const saveChanges = ()=>{
            //Esto tendria quqe ser una promesa que resuelva cuando la promesa de la BD resuelva....
            //Tendria que ordenrar el tagChanges de modo que primero esten los 'delete' luego 'create' y 'update'
            //en el boton : saveChanges.then(toggleTagsEditor()); //Taria bueno un spinner o relojito
            NoteData.applyTagChanges(tagsChanges);
        }

        return(
            <div className="tags-editor-container">
            {modalView.show
            ?<Modal 
                acceptHandler={modalView.acceptHandler}
                cancelHandler={modalView.cancelHandler}
                modalText={modalView.modalText}
                classNames={modalView.classNames}
            />
            :null}

            <button onClick={()=>{toggleTagsEditor()}}>Cancelar</button>
            <button onClick={()=>{
                //toggleTagsEditor();
                NoteData.applyTagChanges(tagsChanges).then((r)=>console.log('Ahora si termine con todo..'));
                }} disabled={shouldDisableSaveButton()}>Save Changes</button>
            
            <TagInputCreator saveTagHandler={createNewTagHandler} allTags={allTagsLocal}/>
            {
                allTagsLocal.map((localTag)=>{
                    return(
                    <div key={localTag.localKey}>
                        <button onClick={()=>{
                            setModalView({
                               show:true,
                               acceptHandler:()=>{deleteTagHandler(localTag)},
                               cancelHandler:()=>{closeModal()},
                               modalText:`Esta seguro de eliminar el tag ${localTag.name} ?`,
                               classNames:'',
                            });
                            }}>D</button> 
                        
                        <TagInput tagName={localTag.name} tagChangeHandler={
                            (newTagName)=>{updateTagNameHandler(localTag,newTagName)} 
                            }/>
                    </div>
                )}
                )
            }
        </div>
    )
}

const TagsEditorContainer = ()=>{
    const {view} = useContext(Context);
    return(<>{(view === 'tagsEditor')?<TagsEditor />:null}</>);
}
export default TagsEditorContainer;


/*
Consideraciones de tags:
- los tags no pueden editarse para ser vacios ('') o espacioes en blanco (' ', '     ');
- los tags no pueden editarse para ser igual a otro tag: tag,tag2 -> tag,tag .
*/