//PPAL
import {NoteData} from "../data/Data";
import { createContext,useEffect,useState } from "react";
import './styles.css';
import NoteEditor from './NoteEditor';
import SidePanel from './SidePanel';
import SearchBar from './SearchBar';
import BottomBar from './BottomBar';
import NoteList from './NoteList';

const initialNoteList =[{id:1, title:'Loading...'}]; 
//export const NoteData = new Data(); //TODO esta bien aca este export? es feo?


export const Context = createContext({
    isSidePanelVisible:false,
    toggleSidePanel:()=>console.log('toggleSidePanel en createContext')
}); 

const DefaultProvider = ({children})=>{
    const [isSidePanelVisible, setSidePanelVisible] = useState(false);
    const [isNoteEditorVisible, setNoteEditorVisible] = useState(false);
    const [searchTerm,setSearchTerm] = useState('');
    const [noteList,setNoteList] = useState(initialNoteList);

    //init
    useEffect(()=>{
        NoteData.connect().then(()=>{
            NoteData.getAllNotes().then((allNotes)=>{
                setNoteList(NoteData.orderArrayByIds(allNotes))
            });//tendira que ordernar tambien aca.
        })
    },[]);

    const value = {
        isSidePanelVisible: isSidePanelVisible,
        toggleSidePanel: ()=>setSidePanelVisible(!isSidePanelVisible),
        isNoteEditorVisible: isNoteEditorVisible,
        toggleNoteEditor: ()=>setNoteEditorVisible(!isNoteEditorVisible),
        searchTerm: searchTerm,
        setSearchTerm: (newSearchTerm)=> setSearchTerm(newSearchTerm),
        noteList: noteList,
        setNoteList: setNoteList,
    }

    return (<Context.Provider value = {value}> {children} </Context.Provider>);
}




const Copi = () => {
    return(
        <div>
            <DefaultProvider>
                <SidePanel/>
                <NoteEditor/>
                <SearchBar/>
                <NoteList/>
                <BottomBar/>
            </DefaultProvider>
        </div>
    )
}//fin Copi

export default Copi;
