import { useEffect, useMemo, useState ,memo } from "react";
import {NoteData} from "../data/Data";



const NoteTagsEditor = memo((props)=>{
    console.log('TagsEditor rendering...');
    const {note,saveNoteTagsHandler,showTagsEditorHandler} = props;
    const [noteNewTags,setThisNoteTags] = useState(note? note.noteTags : []);//[1,2,55,74]
    const [filteredTagsAvailable,setFilteredTagsAvailable] = useState(NoteData.allTagsAvailable);//[{id:74, tagName:'X'}]
    
    //Esto evita que quede la info de otra nota abierta anteriormente. NO hace falta si TagsEditor se destruye cada vez q se cierra.
    // const noteTags = useMemo(()=> note? note.noteTags : [] ,[note]);
    // useEffect(()=>{
    //     setThisNoteTags(noteTags);
    // },[noteTags]);

    const filterChangeHandler = (term)=>{
        if(term ==='')
            return (setFilteredTagsAvailable(NoteData.allTagsAvailable));

        const newFilteredTags = NoteData.allTagsAvailable.filter((tag)=>{
            const termNormalized = term.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
            const tagNormalized = tag.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");//tag.tagName HHH
            return (tagNormalized.startsWith(termNormalized));
        });
        return setFilteredTagsAvailable(newFilteredTags);
    }

    const checkBoxesHandleChange = (e)=>{
        let tagId = e.target.value.toString();
        setThisNoteTags(//esto es un toggle
            noteNewTags.includes(tagId) //Aca tiene que ser el id, y no su tagName HHH (e.target.value)
             ? noteNewTags.filter(id => id !== tagId) //(i=>i.id !== e.target.value)
             : [ ...noteNewTags, tagId ] //e.target.value
        );
    }
   
    const saveButtonHandler=()=>{
        saveNoteTagsHandler([...noteNewTags]);
    }

    return(
        <div className="tags-editor-container"> 
            <TagFilter filterChangeHandler = {filterChangeHandler} showCreateTagButton={(filteredTagsAvailable.length===0)}/>
            <button onClick={()=>{saveButtonHandler(); showTagsEditorHandler(false);}}>Aceptar</button>
            <button onClick={()=>{showTagsEditorHandler(false)}}>Cancelar</button>
            {filteredTagsAvailable.map((tag)=>{ //HHH
                return <CheckBoxTag key={tag.id} tagName={tag.name} tagId={tag.id} isChecked={noteNewTags.includes(tag.id.toString())} handleChange={checkBoxesHandleChange}/>
            })}
        </div>
    )
})

const CheckBoxTag = (props)=>{
    const {tagName,tagId,isChecked,handleChange} = props;
    return (
    <>
        <p>{tagName}</p>
        <input type ='checkbox' 
        name={tagName}
        onChange = {handleChange}
        checked={isChecked}
        value={tagId}
        />
    </> 
    )
}

const TagFilter = (props)=>{
    const {filterChangeHandler,showCreateTagButton} = props;
    const [term,setTerm] = useState('');

    const addTagHandler=(term)=>{
        NoteData.addNewTag(term).then(()=>{
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