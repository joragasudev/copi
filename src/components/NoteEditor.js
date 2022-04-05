import { Context } from "./Copi";
import { useContext,useRef, useState,memo } from "react";
import {AppData} from "../data/Data2";
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
    const {noteToEdit,setNoteList,view,setView} = useContext(Context);
    const noteEditorRef = useRef(null);
    const [noteTags,setNoteTags] = useState(noteToEdit?noteToEdit.noteTags:[]);
    const [title,setTitle] = useState(noteToEdit? noteToEdit.title : 'title...');
    const [text,setText] = useState(noteToEdit? noteToEdit.text : 'text...');
    const [showTagEditor,setShowTagEditor] = useState(false);//Ver si esto no me combiene hacerlo simil al tagsEditor....???? quiza no

    return(
        <div id="note-editor" ref={noteEditorRef} className={`note-editor ${(view==='noteEditor')? 'note-editor-show' : ''}`}>
            <button onClick={()=>{
                noteEditorRef.current.classList.toggle('note-editor-show');
                setView('default');
                }} >Cerrar</button>

            <button onClick={()=>{
                if(noteToEdit===null)
                    AppData.saveNewNote({title: title,
                                          text:text,
                                          noteTags:noteTags,})
                                      .then((r)=>{
                                            setNoteList(AppData.allNotesCache);//<-cambiar x AppData.getNotes()
                                        })
                else{
                    AppData.updateNote({title:title,
                            text:text,
                            key:noteToEdit.key,
                            noteTags:noteTags,})
                            .then((r)=>{
                                setNoteList(AppData.allNotesCache);//<-cambiar x AppData.getNotes()
                            });
                    setView('default');
                }
                }}>Guardar</button>

            <TitleInput initialValue={title} titleOnChangeHandler={setTitle} />
            <TextInput initialValue={text} textOnChangeHandler={setText}/>
            {AppData.getTagsByIds(noteTags).map((tag)=><p key={tag.key}>{tag.name}</p>)}
            <button onClick={()=>{setShowTagEditor(true)}}> Tags </button>

            {showTagEditor? <NoteTagsEditor note={noteToEdit} saveNoteTagsHandler={setNoteTags} showTagsEditorHandler = {setShowTagEditor}/> : null}
            
        </div>
    );
}

const NoteEditorContainer = () =>{
    const {view} = useContext(Context);
    return(<>{(view==='noteEditor')?<NoteEditor />:null}</>);
}

export default NoteEditorContainer;