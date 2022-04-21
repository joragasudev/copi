import { Context } from "./Copi";
import { memo, useContext, useEffect, useRef, useState} from "react";
import React from "react";
import { toast,ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DragDropContext } from "react-beautiful-dnd";
import { Droppable } from "react-beautiful-dnd";
import { Draggable } from "react-beautiful-dnd";
import { AppData } from "../data/Data2";
//NoteList deberia ser el padre de una serie de Componentes Memoizados con memo (los de la lista).

const NoteCard = memo((props) =>{
    const {isSelected,note,selectNoteHandler} = props;
    const {setNoteToEdit,appView,setAppView,setNoteList} = useContext(Context);
    const noteCardRef = useRef(null);

    const clickHandler = (event) => {
        if (appView.isSelecting) {
            selectNoteHandler(note.key);
            event.stopPropagation(); //previene copiado...
        }
        else{//react-toastify
            const toastText = note.title.length < 10? note.title : note.title.substring(0,9)+'...';
            toast.info(`${toastText} Copied!`, {
            position: toast.POSITION.BOTTOM_CENTER,
            autoClose: 1000,
            toastId:note.key.toString(),
            pauseOnHover: false,
            pauseOnFocusLoss:false,
            hideProgressBar:true,
            onOpen: () => {},
            onClose: () => {},
            });
        }
      };
  

    function openNoteEditor(event,note){
        setNoteToEdit(note);
        setAppView({view:'noteEditor'});
        event.stopPropagation();
    }

    //esto esta medio feito...
    useEffect(()=>{
        const fn = (e)=>{
            setNoteToEdit(note);
            setAppView({view:'noteEditor'});
            e.stopPropagation(); 
        }
        const noteRef = noteCardRef.current;
        noteRef.addEventListener('long-press', fn);
        return () => { 
            if (noteRef)
                noteRef.removeEventListener('long-press', fn); 
         }
    },[note]);

    return(
    <div className="noteCard" ref={noteCardRef} onClick={(e)=>{clickHandler(e);}} style={isSelected?{backgroundColor:"purple"}:{}}>
        <p>{note.title}</p>
        <p>{note.text}</p>

        {/* {view==='default'?<button onClick={(e)=>{console.log(note); setNoteToEdit(note); setView('noteEditor'); e.stopPropagation();}}>E</button>:null} */}
        {appView.view==='default'?<button onClick={(e)=>{openNoteEditor(e,note)}}>E</button>:null}

        {appView.view==='default'?<button onClick={(e)=>{
            AppData.sendNoteToTrash(note.key).then((noteList)=>{setNoteList(noteList );});
            e.stopPropagation();
            }}>D</button>
        :null}

        {note.state==='trash'? <button onClick={(e)=>{
            AppData.restoreNote(note.key).then((trashedNotes)=>{
                setNoteList(trashedNotes);
            })
            e.stopPropagation();
            }
            }>Restore</button>
        :null}

        {note.state==='trash'? <button onClick={(e)=>{
            AppData.deleteNote(note.key).then((trashedNotes)=>{
                setNoteList(trashedNotes);
            })
            e.stopPropagation();
            }
            }>asesinar</button>
        :null}

        {/* <ToastContainer /> */}
    </div>
    );
});


const ListContent = memo((props) => {
    const {noteList,isDragDisabled} = props;
    const [selectedNotesKeys,setSelectedNotesKeys] = useState([]);
    const {appView,setAppView} = useContext(Context);

    console.log("selectedNotesKeys:", selectedNotesKeys);

    //esto esta medio feo (renderiza 2 veces.)
    useEffect(()=>{
        if(!appView.isSelecting)
            setSelectedNotesKeys([]);
    },[appView]);

    const selectANote = (noteKey)=>{//(toggle)
        selectedNotesKeys.includes(noteKey)
        ? setSelectedNotesKeys(selectedNotesKeys.filter((key)=>key!==noteKey))
        : setSelectedNotesKeys((oldSelectedNotes)=>[noteKey,...oldSelectedNotes]);
    }
    
    const listContent =  noteList.map((note,index) => (
    <Draggable
     key={note.key} 
     draggableId={'draggableID-'+note.key} 
     index={index}
     isDragDisabled={isDragDisabled}>
        {(provided,snapshot)=>(
            <div className='note-card-container'
             id={'note-card-container'+note.key}
             data-note-key={note.key}
             ref={provided.innerRef}
             {...provided.draggableProps}
             {...provided.dragHandleProps}
             style={{...provided.draggableProps.style,
             border : snapshot.isDragging?
             "1px solid red" : "1px solid white" , 
             boxSahdow: snapshot.isDragging?
             "0 0 .4rem #666" : "none"}}>
                <NoteCard isSelected={selectedNotesKeys.includes(note.key)} note={note} selectNoteHandler={selectANote}/>
            </div>
        )}
    </Draggable>
    )) ;

    return (
    <>
    {listContent}
    <ToastContainer/>
    </>)
})

const NoteList = () =>{
    const {noteList,setNoteList,appView} = useContext(Context);
    console.log(appView);
    if (!noteList.length)
        return (<div>No hay notas</div>);

    return(
        <DragDropContext onDragEnd={(dragEndObject)=>{ //DRAG HANDLER
            if (dragEndObject.destination != null){
                const sourceKey = noteList[dragEndObject.source.index].key;
                const destinationKey = noteList[dragEndObject.destination.index].key;
                //Yo tendria que dejar mover las notas que estan x tags, y tambien se tendrian que guardar en ese orden....
                //esto implicaria un par de quilombos, pero seria lo ideal a nivel funcional...
                if (appView.view === 'tagFiltered')
                    setNoteList(AppData.reorderNotesFilteredByTag(sourceKey,destinationKey,appView.tagFilter));
                else
                    setNoteList(AppData.reorderNotes(sourceKey,destinationKey));
        }}}>
            <Droppable droppableId='droppeable-1'>
            {(provided,snapshot)=> (
                <div className='listContainer' ref={provided.innerRef} {...provided.droppableProps}>
                    <ListContent noteList={noteList} isDragDisabled={appView.view!=='default' && appView.view!=='tagFiltered'}/>
                    {/* A lo mejor tendria que crear un flagsito o un objeto state, para saber en que lista estamos y deshabilitar el drag. */}
                    {provided.placeholder}
                </div>
            )}
            </Droppable>
        </DragDropContext>
    )
}






export default NoteList;