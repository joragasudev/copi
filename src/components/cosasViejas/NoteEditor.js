import { Context } from "./Copi";
import { useContext, useEffect, useRef, useState } from "react";
import {NoteData} from "../data/Data";
import TagsEditor from "./TagsEditor";

//if id===null -> es una nueva nota, sino es una edicion de nota.

const TitleInput = (props)=>{
    const {initialValue,titleInputRef} = props;
    const [value,setValue] = useState(initialValue);
    useEffect(()=>{
        setValue(initialValue);
    },[initialValue])
    return(
    <input id="title-input" type='text' name='title' ref={titleInputRef}
            value={value} onChange={(e)=>{setValue(e.target.value)}}/>
    )
}

const TextInput = (props)=>{
    const {initialValue,textInputRef} = props;
    const [value,setValue] = useState(initialValue);
    useEffect(()=>{
        setValue(initialValue);
    },[initialValue])
    return(
    <textarea id="text-input" name="text" rows="4" cols="50" ref={textInputRef} 
            value={value} onChange={(e)=>{setValue(e.target.value)}}>  
    </textarea>
    )
}


const NoteEditor = ()=>{
    console.log('Rendering NoteEditor...');
    const {isNoteEditorVisible, toggleNoteEditor,setNoteList,noteToEdit} = useContext(Context);
    const titleInputRef = useRef(null);
    const textInputRef = useRef(null);
    let title = noteToEdit? noteToEdit.title : 'title...';
    let text = noteToEdit? noteToEdit.text : 'text...';
    
    //problema: no estoy actualizando el noteTags si NO se hace click en Acept del TagsEditor, por lo que toma otros.
    const [noteTags,setNoteTags] = useState(noteToEdit?noteToEdit.noteTags:[]);

    useEffect(()=>{
        setNoteTags(noteToEdit?noteToEdit.noteTags:[]);
    },[noteToEdit]);

    const saveNoteTagsHandler = (noteId,tags)=>{
        console.log(`saveNoteTagsHandelr con noteID: ${noteId}`);
        setNoteTags([...tags]);
    }

    // const noteTags =noteToEdit?noteToEdit.noteTags:[]; 
    // const saveNoteTagsHandler = (noteId,tags)=>{
    //         console.log(`saveNoteTagsHandelr con noteID: ${noteId}`);
    //         noteTags = ([...tags]);
    // } 
    return(
        <div className={`noteEditor `}>
            <button onClick={()=>{toggleNoteEditor()}} >Cerrar</button>
            <button onClick={()=>{
                if(noteToEdit===null)
                    NoteData.saveNewNote({title: titleInputRef? titleInputRef.current.value :'',
                                          text:textInputRef? textInputRef.current.value :'',
                                          noteTags:noteTags,})
                                      .then((allNotes)=>{
                                            setNoteList(allNotes);
                                        })
                else
                    NoteData.updateNote({title: titleInputRef? titleInputRef.current.value :'',
                            text:textInputRef? textInputRef.current.value :'',
                            id:noteToEdit.id,
                            noteTags:noteTags,})
                            .then((allNotes)=>{
                                setNoteList(allNotes);
                            }) 
                }}>
                Aceptar
            </button>
            <TitleInput initialValue={title} titleInputRef={titleInputRef}/>
            <TextInput initialValue={text} textInputRef={textInputRef}/>
    
            <TagsEditor note={noteToEdit} saveNoteTagsHandler={saveNoteTagsHandler}/>
        </div>
    );
}
export default NoteEditor;