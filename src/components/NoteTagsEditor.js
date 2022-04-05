import { useEffect, useMemo, useState ,memo } from "react";
import {AppData} from "../data/Data2";



const NoteTagsEditor = memo((props)=>{
    console.log('TagsEditor rendering...');
    const {note,saveNoteTagsHandler,showTagsEditorHandler} = props;
    const [thisNoteTags,setThisNoteTags] = useState(note? note.noteTags : []);//[1,2,55,74]
    const [filteredTagsAvailable,setFilteredTagsAvailable] = useState(AppData.allTagsCache);//[{id:74, tagName:'X'}]
    
    //Esto evita que quede la info de otra nota abierta anteriormente. NO hace falta si TagsEditor se destruye cada vez q se cierra.
    // const noteTags = useMemo(()=> note? note.noteTags : [] ,[note]);
    // useEffect(()=>{
    //     setThisNoteTags(noteTags);
    // },[noteTags]);

    const filterChangeHandler = (term)=>{
        if(term.trim() ==='')
            return (setFilteredTagsAvailable(AppData.allTagsCache));

        const newFilteredTags = AppData.allTagsCache.filter((tag)=>{
            const termNormalized = term.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
            const tagNormalized = tag.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
            return (tagNormalized.startsWith(termNormalized));
        });
        return setFilteredTagsAvailable(newFilteredTags);
    }

    const checkBoxesHandleChange = (e)=>{
        let tagKey = parseInt(e.target.value);
        setThisNoteTags(//esto es un toggle
            thisNoteTags.includes(tagKey) //Aca tiene que ser el id, y no su tagName HHH (e.target.value)
             ? thisNoteTags.filter(id => id !== tagKey) //(i=>i.id !== e.target.value)
             : [ ...thisNoteTags, tagKey ] //e.target.value
        );
    }
   
    const saveButtonHandler=()=>{
        saveNoteTagsHandler([...thisNoteTags]);
    }

    return(
        <div className="tags-editor-container"> 
            <TagFilter filterChangeHandler = {filterChangeHandler} showCreateTagButton={(filteredTagsAvailable.length===0)}/>
            <button onClick={()=>{saveButtonHandler(); showTagsEditorHandler(false);}}>Aceptar</button>
            <button onClick={()=>{showTagsEditorHandler(false)}}>Cancelar</button>
            {filteredTagsAvailable.map((tag)=>{ //HHH
                return <CheckBoxTag key={tag.key} tagName={tag.name} tagKey={tag.key} isChecked={thisNoteTags.includes(tag.key)} handleChange={checkBoxesHandleChange}/>
            })}
        </div>
    )
})

const CheckBoxTag = (props)=>{
    const {tagName,tagKey,isChecked,handleChange} = props;
    return (
    <>
        <p>{tagName}</p>
        <input type ='checkbox' 
        name={tagName}
        onChange = {handleChange}
        checked={isChecked}
        value={tagKey}
        />
    </> 
    )
}

const TagFilter = (props)=>{
    const {filterChangeHandler,showCreateTagButton} = props;
    const [term,setTerm] = useState('');

    const addTagHandler=(term)=>{
        AppData.saveNewTag(term).then(()=>{
            filterChangeHandler(term);
        }
        );
    }
    return(
        <>
            <input id="searchTags" type='text' name='searchTags' onChange={(e)=>{
                filterChangeHandler(e.target.value);
                setTerm(e.target.value);
            }}/>
            {showCreateTagButton? <button onClick={()=>{addTagHandler(term)}}>{`Crear tag:${term}`}</button>:null}
        </>
    )
}

export default NoteTagsEditor;