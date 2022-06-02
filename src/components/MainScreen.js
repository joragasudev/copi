import { Context } from "./Copi";
import { memo, useContext, useEffect, useRef, useState} from "react";
import React from "react";
import { toast,ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DragDropContext } from "react-beautiful-dnd";
import { Droppable } from "react-beautiful-dnd";
import { Draggable } from "react-beautiful-dnd";
import { AppData } from "../data/Data";
import TopBar from "./TopBar";
import AddNoteButton from "./AddNoteButton";

const NoteCard = memo((props) =>{
    const {isSelected,note,selectNoteHandler} = props;
    const {setNoteToEdit,appView,setAppView} = useContext(Context);
    const noteCardRef = useRef(null);

    const clickHandler = (event) => {
        if (appView.isSelecting) {
            selectNoteHandler(note.key);
            event.stopPropagation(); //Prevents selecting a note from being copied to the clipboard.
        }
        else{//react-toastify
            const toastText = AppData.truncateText(note.title);
            toast.info(`${toastText} Copied!`, {
            position: toast.POSITION.BOTTOM_CENTER,
            autoClose: 1000,
            toastId:note.key.toString(),
            pauseOnHover: false,
            pauseOnFocusLoss:false,
            hideProgressBar:true,
            delay:0,
            onOpen: () => {},
            onClose: () => {},
            });
        }
      };
      

    useEffect(()=>{
        const longPressEffect = (e)=>{
            setNoteToEdit(note);
            setAppView({...appView, noteEditor:true,sidePanel:false,tagsEditor:false});
            e.stopPropagation(); 
        }
        const noteRef = noteCardRef.current;
        noteRef.addEventListener('long-press', longPressEffect);

        return () => { 
            if (noteRef){
                noteRef.removeEventListener('long-press', longPressEffect);
            }
         }
    },[note,appView]);

    return(
    <div className={`noteCard ${isSelected?'noteCardContainer--selected':''} noteCardContainer--white`} ref={noteCardRef} 
    onClick={(e)=>{clickHandler(e);}}
    >
        <div className="ellipsis noteCardContainer__title">
            {note.title}
        </div>
        <div className="noteCardContainer__text">
            {note.text}
        </div>

    </div>
    );
});

const ListContent = memo((props) => {
    const {noteList,isDragDisabled,selectedNotesKeys,setSelectedNotesKeys} = props;

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
            <div className='noteCardContainer'
             id={'noteCardContainer'+note.key}
             data-note-key={note.key}
             ref={provided.innerRef}
             {...provided.draggableProps}
             {...provided.dragHandleProps}
             style={{...provided.draggableProps.style,
             border : snapshot.isDragging?
             "1px solid transparent" : "1px solid transparent" , 
             boxShadow: snapshot.isDragging?
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
    </>
    )
})

const MainScreen = () =>{
    const [selectedNotesKeys,setSelectedNotesKeys] = useState([]);
    const {noteList,setNoteList,appView,setAppView} = useContext(Context);
    
    const sendNotesToTrashHandler = ()=>{
        AppData.sendNotesToTrash(selectedNotesKeys).then((notesList)=>{
             setSelectedNotesKeys([]);
             setAppView({...appView,view:'default',isSelecting:false});
             setNoteList(notesList);
        });
    }
    const sendNotesInTagsToTrashHandler = ()=>{
        AppData.sendNotesToTrash(selectedNotesKeys).then((notesList)=>{
            setSelectedNotesKeys([]);
            setAppView({...appView,view:'tagFiltered',isSelecting:false});
            setNoteList(AppData.getNotesFilteredByTag(appView.tagFilter));
        });
    }
    const deleteNotesHandler = ()=>{
        AppData.deleteNotes(selectedNotesKeys).then((notesInTrash)=>{
            setSelectedNotesKeys([]);
            setAppView({...appView,view:'trash',isSelecting:false});
            setNoteList(notesInTrash);
        });
    }
    const restoreNotesHandler = ()=>{
        AppData.restoreNotes(selectedNotesKeys).then((notesInTrash)=>{
            setAppView({...appView,view:'trash',isSelecting:false}); 
            setNoteList(notesInTrash);
            setSelectedNotesKeys([]);
        }); 
    }
    const clearSelection = ()=>{
        setSelectedNotesKeys([]);
    }
    const listTitle = ()=>{
        if (!noteList.length)
            return 'NO NOTES'
        if (appView.view === 'default')
            return 'ALL NOTES'
        if (appView.view === 'trash')
            return 'TRASHCAN'
        if (appView.view === 'tagFiltered')
            return ('TAG: '+AppData.getTagName(appView.tagFilter))
    }

    // RETURN
    if (!noteList.length)
        return (
            <div className="mainScreen">
                <TopBar sendNotesToTrashHandler={sendNotesToTrashHandler} clearSelection={clearSelection}/>
                <div className="listTitle">{listTitle()}</div>
                <AddNoteButton/>
            </div>
        );

    return(
        <div className="mainScreen">
        {/* TopBar (SideMenu button, search bar, and select notes button) */}
        <TopBar 
            sendNotesToTrashHandler={sendNotesToTrashHandler}
            sendNotesInTagsToTrashHandler = {sendNotesInTagsToTrashHandler}
            deleteNotesHandler = {deleteNotesHandler}
            restoreNotesHandler = {restoreNotesHandler}
            clearSelection={clearSelection}
            selection = {selectedNotesKeys}
            />

        {/* List Title  */}
        <div className="listTitle ellipsis">{listTitle()}</div>

        {/* Drag and drop Notes List */}
        <DragDropContext onDragEnd={(dragEndObject)=>{ //DRAG HANDLER
            if (dragEndObject.destination != null){
                const sourceKey = noteList[dragEndObject.source.index].key;
                const destinationKey = noteList[dragEndObject.destination.index].key;
                if (appView.view === 'tagFiltered')
                    setNoteList(AppData.reorderNotesFilteredByTag(sourceKey,destinationKey,appView.tagFilter));
                else
                    setNoteList(AppData.reorderNotes(sourceKey,destinationKey));
        }}}>
            <Droppable droppableId='droppeable-1'>
                {(provided,snapshot)=> (
                    <div className='listContainer' ref={provided.innerRef} {...provided.droppableProps}>
                        <ListContent 
                            noteList={noteList}
                            isDragDisabled={appView.view!=='default' && appView.view!=='tagFiltered'}
                            selectedNotesKeys = {selectedNotesKeys}
                            setSelectedNotesKeys = {setSelectedNotesKeys}
                        />
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>

        {/* new Note button (+) */}
        <AddNoteButton/>
        </div>
    )
}



export default MainScreen;