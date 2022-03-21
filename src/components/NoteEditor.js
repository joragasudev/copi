import { Context } from "./Copi";
import { useContext,useRef, useState,memo } from "react";
import {NoteData} from "../data/Data";
import NoteTagsEditor from "./NoteTagsEditor";

//if id===null -> es una nueva nota, sino es una edicion de nota.

const TitleInput = memo((props)=>{
    console.log('Title render.');
    const {initialValue,titleOnChangeHandler} = props;
    const [value,setValue] = useState(initialValue);
    const onChangeHandler = (value)=>{
        setValue(value);
        titleOnChangeHandler(value);
    }

    return(
    <input id="title-input" type='text' name='title'
            value={value} onChange={(e)=>{onChangeHandler(e.target.value)}}/>
    )
})

const TextInput = memo((props)=>{
    console.log('Text render.');
    const {initialValue,textOnChangeHandler} = props;
    const [value,setValue] = useState(initialValue);
    const onChangeHandler = (value)=>{
        setValue(value);
        textOnChangeHandler(value);
    }
   
    return(
    <textarea id="text-input" name="text" rows="4" cols="50"
            value={value} onChange={(e)=>{onChangeHandler(e.target.value)}}>  
    </textarea>
    )
})



const NoteEditor = ()=>{
    console.log('Rendering Nuevo3v2 NoteEditor...');
    const {noteToEdit,setNoteList,toggleNoteEditor,isNoteEditorVisible} = useContext(Context);
    const noteEditorRef = useRef(null);
    const [noteTags,setNoteTags] = useState(noteToEdit?noteToEdit.noteTags:[]);
    const [title,setTitle] = useState(noteToEdit? noteToEdit.title : 'title...');
    const [text,setText] = useState(noteToEdit? noteToEdit.text : 'text...');
    const [showTagEditor,setShowTagEditor] = useState(false);

    return(
        <div id="note-editor" ref={noteEditorRef} className={`note-editor ${isNoteEditorVisible?'note-editor-show' : ''}`}>
            <button onClick={()=>{
                noteEditorRef.current.classList.toggle('note-editor-show');
                toggleNoteEditor();
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

            <TitleInput initialValue={title} titleOnChangeHandler={setTitle} />
            <TextInput initialValue={text} textOnChangeHandler={setText}/>
            {NoteData.getTagsByIds(noteTags).map((tag)=><p key={tag.id}>{tag.name}</p>)}
            <button onClick={()=>{setShowTagEditor(true)}}> Tags </button>

            {showTagEditor? <NoteTagsEditor note={noteToEdit} saveNoteTagsHandler={setNoteTags} showTagsEditorHandler = {setShowTagEditor}/> : null}
            
        </div>
    );
}

const NoteEditorContainer = () =>{
    const {isNoteEditorVisible} = useContext(Context);
    return(<>{isNoteEditorVisible?<NoteEditor />:null}</>);
}

export default NoteEditorContainer;