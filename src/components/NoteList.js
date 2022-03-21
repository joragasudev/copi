import { Context } from "./Copi";
import { memo, useContext, useState} from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { Droppable } from "react-beautiful-dnd";
import { Draggable } from "react-beautiful-dnd";
import { NoteData } from "../data/Data";
import NoteEditor from './NoteEditor';
//NoteList deberia ser el padre de una serie de Componentes Memoizados con memo (los de la lista).

const NoteList = () =>{
    const {noteList,setNoteList} = useContext(Context);

    return(
        <DragDropContext onDragEnd={(dragEndObject)=>{ //DRAG HANDLER
            if (dragEndObject.destination != null){
            const sourceIndex = dragEndObject.source.index;
            const destinationIndex = dragEndObject.destination.index;
            
            setNoteList(NoteData.reorderNotes(sourceIndex,destinationIndex));
            //viejo:
            // NoteData.reorderNotes(sourceIndex,destinationIndex).then((orderedNotes)=>{
            //     setNoteList(orderedNotes);
            // });   
        }}}>
            <Droppable droppableId='droppeable-1'>
            {(provided,snapshot)=> (
                <div className='listContainer' ref={provided.innerRef} {...provided.droppableProps}>
                    <MListContent noteList={noteList} isDragDisabled={false}/>
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
    const {setNoteToEdit,toggleNoteEditor} = useContext(Context);
    
    return(
    <div className="noteCard">
        <p>{note.title}</p>
        <p>{note.text}</p>
        <button onClick={(e)=>{setNoteToEdit(note); toggleNoteEditor(true); e.stopPropagation();}}>E</button>
    </div>
    );
}
const ListContent = (props) => {
    const {noteList,isDragDisabled} = props;
    
    const listContent =  noteList.map((note,index) => (
    <Draggable
     key={note.id} 
     draggableId={'draggableID-'+note.id} 
     index={index}
     isDragDisabled={isDragDisabled}>
        {(provided,snapshot)=>(
            <div className='note-card-container'
             id={'note-card-container'+note.id}
             data-note-id={note.id}
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
}
const MListContent = memo(ListContent);




export default NoteList;