import { Context } from "./Copi";
import { useContext, useRef } from "react";
import {NoteData} from "../data/Data";


const NoteEditor = ()=>{
    const {isNoteEditorVisible, toggleNoteEditor,setNoteList} = useContext(Context);
    const titleInputRef = useRef(null);
    const textInputRef = useRef(null);
    return(
        <div className={`note-editor ${isNoteEditorVisible?'note-editor-show' : ''}`}>
            <button onClick={()=>{toggleNoteEditor()}} >Cerrar</button>
            <button onClick={()=>{//Data.saveNewNote(newNote).then((allNotes)=>{...setNoteList(allNotes)...
                NoteData.saveNewNote({title: titleInputRef? titleInputRef.current.value :'',
                            text:textInputRef? textInputRef.current.value :''}).then((allNotes)=>{
                    //aca o bien, seteo el orden, o bien ya ordeno. Estaria bueno que sea un metodo
                    setNoteList(allNotes.sort((a,b)=>{
                        return (NoteData.notesOrder.indexOf(a.id) - NoteData.notesOrder.indexOf(b.id));
                    }) );
                    //setNoteList(NoteData.orderArrayByIds(allNotes));
                })
            }}>Crear nueva Nota</button>
            <input id="title-input" type='text' name='title' ref={titleInputRef} onChange={(e)=>{}}/>
            <textarea id="text-input" name="text" rows="4" cols="50" ref={textInputRef} defaultValue='texto...'></textarea>
        </div>
    );
}

export default NoteEditor;

/*Cuando creo una nueva nota tengo que ?:
1-Agregar el nuevo ID a la noteOrder de la vista ppal [nuevoid,...noteIdsPpal]; ASYNC
2-Guardar efectivamente en la BD la nueva nota. ASYNC
3-Recuperar la lista nueva de la BD y ordenarla segun el noteOrder del pto 1. ASYNC
 */