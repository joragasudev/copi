import {AppData} from "../data/Data";
import { createContext,useEffect,useState } from "react";
import SidePanel from './SidePanel';
import AddNoteButton from './AddNoteButton';
import MainScreen from './MainScreen';
import NoteEditorContainer from "./NoteEditor";
import TagsEditorContainer from "./TagsEditor";
import './styles.css';


export const Context = createContext({}); 

//appView = {view:'default'|'tagFiltered'|'trash' , tagsEditor:true|false, sidePanel:true|false, noteEditor:true|false, tagFilter:int, isSelecting:true|false}
const DefaultProvider = ({children})=>{
    const [appView,setAppView] = useState({view:'default'});
    const [noteList,setNoteList] = useState(null);
    const [noteToEdit,setNoteToEdit] = useState(null);

    //init
    useEffect(()=>{
         AppData.connect().then( ()=>{ setNoteList(AppData.getNotes()) }); 
    },[]);

    const value = {
        appView: appView,
        setAppView : setAppView,
        noteList: noteList,
        setNoteList: setNoteList,
        noteToEdit:noteToEdit,
        setNoteToEdit:setNoteToEdit,
    }

    return ( 
        noteList
        ? <Context.Provider value = {value}> {children} </Context.Provider> 
        : <div>Loading....</div>
    );
}

const Copi = () => {
    return(
        <>
            <DefaultProvider>
                <SidePanel/>
                <NoteEditorContainer/>
                <TagsEditorContainer/>
                <div className="mainScreen">
                    <MainScreen/>
                    <AddNoteButton/>
                </div>
            </DefaultProvider>
        </>
    )
}//fin Copi

export default Copi;
