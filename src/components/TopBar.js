import { Context } from "./Copi";
import { useContext,useState } from "react";
import { AppData } from "../data/Data";
import Modal from "./Modal";

const SEARCH_DELAY_MS = 300;
let lastTimeOutID = -1;

const TopBar = (props) =>{
    const {sendNotesToTrashHandler,sendNotesInTagsToTrashHandler,deleteNotesHandler,restoreNotesHandler,selection,clearSelection} = props;
    const {noteList,setNoteList,appView,setAppView} = useContext(Context);
    const [modalObject,setModalObject] = useState({show:false});

    const delayedSetSearchTerm = (e)=>{
        clearTimeout(lastTimeOutID);
        lastTimeOutID = setTimeout(() => {
            setNoteList(AppData.searchNotes(e.target.value,appView));
        }, SEARCH_DELAY_MS);    
    }

    const trashCanModalBehavior = ()=>{

        const trashCanModalAcceptHandler = ()=>{
            if (appView.view === 'default')
                return sendNotesToTrashHandler;
            if (appView.view === 'tagFiltered')
                return sendNotesInTagsToTrashHandler;
            if (appView.view === 'trash')
                return deleteNotesHandler;
        }
        const trashCanModalText = ()=>{
            if (appView.view === 'default' || appView.view ==='tagFiltered')
                return 'Delete these notes?';
            if (appView.view === 'trash')
                return 'Delete these notes permanently?'; 
        }

        let acceptHandler = trashCanModalAcceptHandler();
        let modalText = trashCanModalText();
        
        return ({
            show:true,
            modalAcceptHandler:acceptHandler,
            modalText:modalText,
        });
    }

    const disableTrashButton=(selection?selection.length===0:false);

    return (
        <div className="topBar">
            {/* Confirmation Modal */}
            {modalObject.show?
            <Modal
                acceptHandler={modalObject.modalAcceptHandler}
                cancelHandler={()=>{setModalObject({show:false})}}
                modalText={modalObject.modalText}
            />
            :null}

            {/* SidePanel button */}
            <button className="iconButton" disabled={appView.isSelecting} onClick={()=>setAppView( {...appView,sidePanel:true} )}>
                <img className={`icon ${appView.isSelecting?'icon--disabled':''}`} src="/assets/hamburger.svg" alt="SP" />
            </button>

            {/* Middle searchBar and buttons */}
            <div className="topBar__middleElements">
              {/* Search Input */}
              <input className="input topBar__middleElements__searchInput" placeholder="Search..." autoComplete="off" id="searchInput" type='text' name='search' onChange={(e)=>{delayedSetSearchTerm(e)}}/>
              
              {/* magGlass */}
              <button className="iconButton" onClick={()=>{document.getElementById("searchInput").focus();}}>
                <img className="icon " src={"assets/search.svg"} alt="magGlass" />
              </button>
            
              {/* Button: Select notes / Cancel selection */}
              <button className={"iconButton"} disabled={noteList.length===0} onClick={()=>{
                    if(appView.isSelecting){
                        setAppView({...appView, isSelecting:false});
                        clearSelection(); 
                    }else{
                        setAppView({...appView, isSelecting:true}); 
                    }
                    }}>

                <img className={`icon ${noteList.length===0? 'icon--disabled' : ''}`} src={appView.isSelecting? "/assets/close.svg":"/assets/checklist_select.svg"} alt="SP" />
              </button>

              {/* Restore */}
              <button className="iconButton" disabled={(appView.view!=='trash' || !appView.isSelecting)} onClick={
                        ()=>{setModalObject({
                            show:true,
                            modalAcceptHandler:restoreNotesHandler,
                            modalText:'Restore these notes?'
                        });
                        }
                    }>
                    <img className={`
                        icon  
                        ${disableTrashButton?'icon--disabled':''} 
                        ${(appView.view!=='trash' || !appView.isSelecting)?'icon--hide':''}
                        `} 
                    src="/assets/restore_from_trash.svg"
                    alt="SP"
                    />
              </button>
            </div>

            {/* Delete. invokes the confimation Modal*/} 
            <button className="iconButton" disabled={disableTrashButton} onClick={()=>{setModalObject(trashCanModalBehavior())}}>
                <img className={`icon ${disableTrashButton?'icon--disabled':''} ${!appView.isSelecting?'icon--hide':''}`} 
                    src={appView.view==='trash'?"/assets/delete_forever.svg":"/assets/trashCan.svg"} 
                    alt="SP"
                />
            </button>

        </div>
    )
}

export default TopBar;