import { Context } from "./Copi";
import { useContext,memo,useState, useReducer, useEffect } from "react";
import {NoteData} from "../data/Data";
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


//action ={ type : 'string', payload: any} , action siempre va a tener un type.
//action ={type: 'update', payload:{id:3 , name:'updatedTagName'} }
//action ={type: 'delete', payload:{id:1} }
//action ={type: 'create', payload:{name:'newTagName'} }
const tagsChangerReducer = (state,action)=> {
    switch(action.type){
        case 'delete':{
            let index = 0;
            for (let element of state){
                if( (element.type === 'update' || element.type === 'delete') &&
                    (action.payload.id.toString() === element.payload.id.toString()) ){
                        state[index] = action;
                        return ([...state]);
                }
                index++;
            }
            return ([action,...state]);
        }

        case 'update':{
            let index = 0;
            for (let element of state){
                if( (element.type === 'update') &&
                    (action.payload.id.toString() === element.payload.id.toString()) ){
                        state[index] = action;
                        return ([...state]);
                }
                index++;
            }
            return ([action,...state]);
        }

        case 'create':{
            // tendria que chequear que el nuevo nombre sea compatible.... (no se deberia dejar directamente en la interfaz....)
            return ([action,...state]);
        }
        default:
            return state
    }
}

const TagsEditor=()=>{
        const {toggleTagsEditor} = useContext(Context);
        const [allTags,setAllTags] = useState(NoteData.allTagsAvailable); // [{id:3, name:'cocina'},{id:10, name:'perros},...]
        const [tagsChanges,dispatchTagsChanges] = useReducer(tagsChangerReducer,[]);
        const [modalView,setModalView] = useState({show:false});
        console.log(tagsChanges);
        //usar un reducer? dispatcharea con update en el tagChagesHandler, y con delete en el boton D. Generaria un estado asi:
        //tagsChanges = [ {id:3, task:'update', name:'casas' },{id:21, task:'delete'},{id:4, task:'update', name:'caca'} ]
        //Luego solo aplicaria esos cambios a la BD cuando se apriete el boton SaveChanges.
        const tagNameChangeHandler = (tagId,newTagName)=>{
            dispatchTagsChanges({type:'update', payload:{id:tagId, name:newTagName}});
        }
        const deleteTagHandler = (tagId) => {
            dispatchTagsChanges({type:'delete', payload:{id:tagId.toString()}});
            const index = allTags.findIndex ((element)=>{ return element.id.toString() === tagId.toString() });
            setAllTags( [...allTags.slice(0,index),...allTags.slice(index+1)] );
        } 
        const closeModal=()=>{
            setModalView({show:false});
        }
        const saveNewTagHandler=(newTag)=>{
            /*
            0-Digamos que el metodo guardarEsteTag, deberia no solo guardar, sino que tambien retornar el nuevo tag. 
            NoteData.guardarEsteTag(nuevoTag).then((nuevoTagconNuevoId)=>{
                setAllTags(nuevoTagconNuevoId,...allTags).sortedPonele();
            })
            el problema es que recupero todo otra vez los "cambios q hice" no surgen efecto.
            o bien tendria que hacer una de estas dos goriladas:
            1- meterlo con un id negativo -1 -2 -3
            2- wrappear allTags y ponerle un id local (muy feo.)
            */
            NoteData.addNewTag(newTag).then(()=>{
                setAllTags(NoteData.allTagsAvailable);
            });
        }
       
        //El aceptar quiza deba hacer saveChangestoDB().then(toggleTagsEditor....)
        //y el delete tengo que elevar el modal?
        // setModalView( {show:true, acceptHandler: deleteTagHandler(tag.id); ,cancelHandler: closeModal ,modalText: `delete tag ${tag.id}`,classNames:''} );
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
            <button onClick={()=>{toggleTagsEditor();console.log('*enviaria tagsChanges a aplicar...*');}}>Save Changes</button>
            <TagInputCreator saveTagHandler={saveNewTagHandler} allTags={allTags}/>
            {
                allTags.map((tag)=>{
                    return(
                    <div key={tag.id}>
                        <button onClick={()=>{
                            setModalView({
                               show:true,
                               acceptHandler:()=>{deleteTagHandler(tag.id)},
                               cancelHandler:()=>{closeModal()},
                               modalText:`Esta seguro de eliminar el tag ${tag.name} ?`,
                               classNames:'',
                            });
                            }}>D</button> 
                        
                        <TagInput tagName={tag.name} tagChangeHandler={
                            (newTagName)=>{tagNameChangeHandler(tag.id,newTagName)} 
                            }/>
                    </div>
                )}
                )
            }
        </div>
    )
}

const TagsEditorContainer = ()=>{
    const {isTagsEditorVisible} = useContext(Context);
    return(<>{isTagsEditorVisible?<TagsEditor />:null}</>);
}
export default TagsEditorContainer;
