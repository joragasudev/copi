import { Context } from "./Copi";
import { useContext } from "react";
import { AppData } from "../data/Data2";
const SEARCH_DELAY_MS = 300;
let lastTimeOutID = -1;//Este deberia estar como un useState dentro del Componente?

const SearchBar = () =>{
    const {setSearchTerm,setNoteList,appView,setAppView} = useContext(Context);

    const delayedSetSearchTerm = (e)=>{
        clearTimeout(lastTimeOutID);
        lastTimeOutID = setTimeout(() => {
            //TODO Se puede hacer con useEffect esto? combiene?
            setSearchTerm(e.target.value);
            setNoteList(AppData.searchNotes(e.target.value,appView.view));
            //NoteData.searchNotes(e.target.value);
        }, SEARCH_DELAY_MS);    
    }

    return (
        <div> 
            <button onClick={()=>{setAppView( {view:'sidePanel'} )}}>SP</button>
            <input id="search2" type='text' name='search' onChange={(e)=>{delayedSetSearchTerm(e)}}/>
            Search

            <button onClick={()=>{
                appView.isSelecting?
                setAppView( {...appView, isSelecting:false} ) : setAppView({...appView, isSelecting:true})
                }}>{appView.isSelecting? 'Cancel':'Select' }</button>
            
            
        </div>
    )
}

export default SearchBar;