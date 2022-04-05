import { Context } from "./Copi";
import { memo, useContext, useState} from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { Droppable } from "react-beautiful-dnd";
import { Draggable } from "react-beautiful-dnd";
import { AppData } from "../data/Data2";
import NoteEditor from './NoteEditor';
//NoteList deberia ser el padre de una serie de Componentes Memoizados con memo (los de la lista).

const NoteList = () =>{
    const {noteList,setNoteList,view} = useContext(Context);
    console.log(view);
    if (!noteList.length)
        return (<div>No hay notas</div>);

    return(
        <DragDropContext onDragEnd={(dragEndObject)=>{ //DRAG HANDLER
            if (dragEndObject.destination != null){
            // const sourceIndex = dragEndObject.source.index;
            // const destinationIndex = dragEndObject.destination.index;
            // setNoteList(AppData.reorderNotes(sourceIndex,destinationIndex));
            const sourceKey = noteList[dragEndObject.source.index].key;
            const destinationKey = noteList[dragEndObject.destination.index].key;
            setNoteList(AppData.reorderNotes(sourceKey,destinationKey));
        }}}>
            <Droppable droppableId='droppeable-1'>
            {(provided,snapshot)=> (
                <div className='listContainer' ref={provided.innerRef} {...provided.droppableProps}>
                    <ListContent noteList={noteList} isDragDisabled={view!=='default'}/>
                    {/* A lo mejor tendria que crear un flagsito o un objeto state, para saber en que lista estamos y deshabilitar el drag. */}
                    {provided.placeholder}
                </div>
            )}
            </Droppable>
        </DragDropContext>
    )
}

const NoteCard_ConNoteEditorProps = (props) =>{
    const {note} = props;
    // const {setNoteToEdit,toggleNoteEditor} = useContext(Context);
    const [showNoteEditor,setShowNoteEditor]= useState(false);
    const closeNoteEditorHandler = ()=>{
        setShowNoteEditor(false);
    }
    return(
        showNoteEditor
        ?<NoteEditor noteToEdit={note} closeNoteEditorHandler={closeNoteEditorHandler}/>
    :<div className="noteCard">
        <p>{note.title}</p>
        <p>{note.text}</p>
        {/* <button onClick={()=>{setNoteToEdit(note);toggleNoteEditor();}}>E</button> */}
        <button onClick={()=>{setShowNoteEditor(true)}}>E</button>
    </div>
    );
}
const NoteCard = (props) =>{
    const {note} = props;
    const {setNoteToEdit,setView} = useContext(Context);
    
    return(
    <div className="noteCard">
        <p>{note.title}</p>
        <p>{note.text}</p>
        <button onClick={(e)=>{setNoteToEdit(note); setView('noteEditor'); e.stopPropagation();}}>E</button>
    </div>
    );
}
const ListContent = memo((props) => {
    const {noteList,isDragDisabled} = props;
    
    const listContent =  noteList.map((note,index) => (
    <Draggable
     key={note.key} 
     draggableId={'draggableID-'+note.key} 
     index={index}
     isDragDisabled={isDragDisabled}>
        {(provided,snapshot)=>(
            <div className='note-card-container'
             id={'note-card-container'+note.key}
             data-note-id={note.key}
             ref={provided.innerRef}
             {...provided.draggableProps}
             {...provided.dragHandleProps}
             style={{...provided.draggableProps.style,
             border : snapshot.isDragging?
             "1px solid red" : "1px solid white" , 
             boxSahdow: snapshot.isDragging?
             "0 0 .4rem #666" : "none"}}>
                <NoteCard note={note}/>
            </div>
        )}
    </Draggable>
    )) ;
    //listContent.splice(0,0,<Separador key={9999} text="Pinned"/>);
    //listContent.splice(6,0,<Separador key={9998} text="Others"/>);
    return listContent;
})





export default NoteList;