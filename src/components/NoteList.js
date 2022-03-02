import { Context } from "./Copi";
import { memo, useContext} from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { Droppable } from "react-beautiful-dnd";
import { Draggable } from "react-beautiful-dnd";
//NoteList deberia ser el padre de una serie de Componentes Memoizados con memo (los de la lista).

const onDragEndHandler=(dragEndObject)=>{
    if (dragEndObject.destination != null){
        const sourceIndex = dragEndObject.source.index;
        const destinationIndex = dragEndObject.destination.index;
        console.log(`dragEndObject ${dragEndObject} `);
        console.log(dragEndObject);
        //HACER EL CAMBIO EN EL ORDEN ACA NoteData.swapElementsOrder(sourceIndex,destinationIndex);
    }
}

const NoteList = () =>{
    const {noteList} = useContext(Context);

    return(
        <DragDropContext onDragEnd={onDragEndHandler}>
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

const NoteCard = (props) =>{
    const {title,text} = props;
    return(
    <div className="noteCard">
        <p>{title}</p>
        <p>{text}</p>
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
                <NoteCard title={note.title} text={note.text}/>
            </div>
        )}
    </Draggable>
    )) ;
    //listContent.splice(0,0,<Separador key={9999} text="Pinned"/>);
    //listContent.splice(6,0,<Separador key={9998} text="Others"/>);
    return listContent;
}
const MListContent = memo(ListContent);


const ListaLoca = (props)=>{
    const {noteList} = props;
    return (
          <div className='listContainer'>
            {noteList.map((elemento)=>{
                return(<div className="cardContainer" key={elemento.id}>
                    <NoteCard title={elemento.title} text={elemento.text}/>
                </div>);
            //<li key={elemento.id}>{elemento.title}</li>)
            })}
         </div>   
    );
};
const MListaLoca = memo(ListaLoca);



export default NoteList;