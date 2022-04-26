import { Context } from "./Copi";
import { useContext,useState } from "react";
import { AppData } from "../data/Data2";
import Modal from "./Modal";
const SEARCH_DELAY_MS = 300;
let lastTimeOutID = -1;//Este deberia estar como un useState dentro del Componente?

const SearchBar = (props) =>{
    const {sendNotesToTrashHandler,sendNotesInTagsToTrashHandler,deleteNotesHandler,restoreNotesHandler,clearSelection} = props;
    const {setNoteList,appView,setAppView} = useContext(Context);
    const [showModal,setShowModal] = useState(false);

    const delayedSetSearchTerm = (e)=>{
        clearTimeout(lastTimeOutID);
        lastTimeOutID = setTimeout(() => {
            //TODO Se puede hacer con useEffect esto? combiene?
            setNoteList(AppData.searchNotes(e.target.value,appView));
        }, SEARCH_DELAY_MS);    
    }

    const modalAcceptHandler = ()=>{
        if (appView.view === 'default')
            return sendNotesToTrashHandler;
        if (appView.view === 'tagFiltered')
            return sendNotesInTagsToTrashHandler;
        if (appView.view === 'trash')
            return deleteNotesHandler;
    }
    const modalText = ()=>{
        if (appView.view === 'default')
        return 'Enviar estas notas a la basura?';
        if (appView.view === 'tagFiltered')
            return 'Enviar estas notas a la basura TAG?';
        if (appView.view === 'trash')
            return 'borrar permanentemente estas notas?'; 
    }

    return (
        <div>
            {/* Este Modal:
                En 'default' deberia enviar a trash y retornar la vista default...
                En 'tagFiltered' deberia enviar a trash y retornar la misma vista tagfiltered... 
                En 'trash', deberia deletearlas de la DB y retornar la vista trash...
                En 'trash', con otro boton o como sea, se tiene que poder restaurar.  */}
            {
            showModal?
            <Modal
                acceptHandler={modalAcceptHandler()}
                cancelHandler={()=>{setShowModal(false)}}
                modalText={modalText()}
            />
            :null}

            <button onClick={()=>{setAppView( {view:'sidePanel'} )}}>SP</button>
            <input id="search2" type='text' name='search' onChange={(e)=>{delayedSetSearchTerm(e)}}/>
            Search

            {/* Boton: Seleccionar/Cancelar */}
            <button onClick={()=>{
                if(appView.isSelecting){
                    setAppView({...appView, isSelecting:false});
                    clearSelection(); 
                }else{
                    setAppView({...appView, isSelecting:true}); 
                }
                }}>{appView.isSelecting? 'Cancel':'Select' }
            </button>
            
            {/* Boton: Borrar("confirmar") con modal   </Modal>*/} 

            {appView.isSelecting?
            <button onClick={()=>{setShowModal(true)}}>Borrar</button>
            :null}

            {( appView.view==='trash' && appView.isSelecting )?
            <button onClick={()=>{restoreNotesHandler()}}>Restore</button>
            :null}
        </div>
    )
}

export default SearchBar;