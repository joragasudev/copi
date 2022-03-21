import { Context } from "./Copi";
import { useContext, useEffect, useRef, useState } from "react";
import {NoteData} from "../data/Data";
import TagsEditor from "./TagsEditor";

//if id===null -> es una nueva nota, sino es una edicion de nota.

const TitleInput = (props)=>{
    const {initialValue,titleOnChangeHandler} = props;
    const [value,setValue] = useState(initialValue);
    const onChangeHandler = (value)=>{
        setValue(value);
        titleOnChangeHandler(value);
    }
    useEffect(()=>{
        setValue(initialValue);
    },[initialValue])
    return(
    <input id="title-input" type='text' name='title'
            value={value} onChange={(e)=>{onChangeHandler(e.target.value)}}/>
    )
}

const TextInput = (props)=>{
    const {initialValue,textOnChangeHandler} = props;
    const [value,setValue] = useState(initialValue);
    const onChangeHandler = (value)=>{
        setValue(value);
        textOnChangeHandler(value);
    }
    useEffect(()=>{
        setValue(initialValue);
    },[initialValue])
    return(
    <textarea id="text-input" name="text" rows="4" cols="50"
            value={value} onChange={(e)=>{onChangeHandler(e.target.value)}}>  
    </textarea>
    )
}


const NoteEditor = (props)=>{
    console.log('Rendering Nuevo NoteEditor...');
    const {noteToEdit,closeNoteEditorHandler} = props;
    const {setNoteList} = useContext(Context);
    const noteEditorRef = useRef(null);
    const [noteTags,setNoteTags] = useState(noteToEdit?noteToEdit.noteTags:[]);
    const [title,setTitle] = useState(noteToEdit? noteToEdit.title : 'title...');
    const [text,setText] = useState(noteToEdit? noteToEdit.text : 'text...');

    //estos tres estados podrian estar en un solo obj con useState o un reducer.
    const saveNoteTagsHandler = (noteId,tags)=>{
        console.log(`saveNoteTagsHandelr con noteID: ${noteId}`);
        setNoteTags([...tags]);
    }
    const titleOnChangeHandler = (value)=>{
        setTitle(value);
    }
    const textOnChangeHandler = (value)=>{
        setText(value);
    }
    return(
        <div /*onClick={(e)=>{e.stopPropagation();}}*/ id="noteeditor" ref={noteEditorRef} className={`note-editor note-editor-show`}>
            <button onClick={()=>{
                noteEditorRef.current.classList.toggle('note-editor-show');
                closeNoteEditorHandler();
                }} >Cerrar</button>

            <button onClick={()=>{
                if(noteToEdit===null)
                    NoteData.saveNewNote({title: title,
                                          text:text,
                                          noteTags:noteTags,})
                                      .then((allNotes)=>{
                                            setNoteList(allNotes);
                                        })
                else
                    NoteData.updateNote({title:title,
                            text:text,
                            id:noteToEdit.id,
                            noteTags:noteTags,})
                            .then((allNotes)=>{
                                setNoteList(allNotes);
                            }) 
                }}>Guardar</button>

            <TitleInput initialValue={title} titleOnChangeHandler={titleOnChangeHandler} />
            <TextInput initialValue={text} textOnChangeHandler={textOnChangeHandler}/>
            <TagsEditor note={noteToEdit} saveNoteTagsHandler={saveNoteTagsHandler}/>
        </div>
    );
}
export default NoteEditor;