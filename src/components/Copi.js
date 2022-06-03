import {AppData} from "../data/Data";
import { createContext,useEffect,useState } from "react";
import SidePanel from './SidePanel';
import MainScreen from './MainScreen';
import './styles.css';


export const Context = createContext({}); 

const DefaultProvider = ({children})=>{
    //appView = {view:'default'|'tagFiltered'|'trash' , tagsEditor:true|false, sidePanel:true|false, noteEditor:true|false, tagFilter:int, isSelecting:true|false}
    const [appView,setAppView] = useState({view:'default'});
    const [noteList,setNoteList] = useState(null);

    //Init
    useEffect(()=>{
         AppData.connect().then( ()=>{ setNoteList(AppData.getNotes()) }); 
    },[]);

    const value = {
        appView: appView,
        setAppView : setAppView,
        noteList: noteList,
        setNoteList: setNoteList,
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
                <MainScreen/>
            </DefaultProvider>
        </>
    )
}

export default Copi;
