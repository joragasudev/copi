//PPAL
import {NoteData} from "../data/Data";
import { createContext,useContext,useEffect,useState } from "react";
import './styles.css';
import SidePanel from './SidePanel';
import SearchBar from './SearchBar';
import BottomBar from './BottomBar';
import NoteList from './NoteList';
import NoteEditorContainer from "./NoteEditor";
import TagsEditorContainer from "./TagsEditor";


export const Context = createContext({
    //esto era el provider q agarra cuando se usa de un Componente que no es hijo de Default Provider? no?
    //isSidePanelVisible:false,
    //toggleSidePanel:()=>console.log('toggleSidePanel en createContext')
}); 

const DefaultProvider = ({children})=>{
    //const [isSidePanelVisible, setSidePanelVisible] = useState(false);// a lo mejor estos dos, tendrian q unirse en un objeto "vistaActiva" o simil.
    //const [isNoteEditorVisible, setNoteEditorVisible] = useState(false);
    const [view,setView] = useState('default');//default/tagsEditor/sidePanel/noteEditor
    const [searchTerm,setSearchTerm] = useState(''); //probablemente no se necesite.
    const [noteList,setNoteList] = useState(null);
    const [noteToEdit,setNoteToEdit] = useState(null);

    //init
    useEffect(()=>{
         NoteData.connect().then( ()=>{ setNoteList(NoteData.getAllNotes()) }); 
        //setNoteList(NoteData.getAllNotes());
    },[]);

    const value = {
        // isSidePanelVisible: isSidePanelVisible,
        // toggleSidePanel: ()=>setSidePanelVisible(!isSidePanelVisible),
        // isNoteEditorVisible: isNoteEditorVisible,
        // toggleNoteEditor: ()=>setNoteEditorVisible(!isNoteEditorVisible)  
        isTagsEditorVisible: view==='tagsEditor',
        toggleTagsEditor: ()=>setView(view=>view==='tagsEditor'? 'default' : 'tagsEditor'),
        isSidePanelVisible: view==='sidePanel',
        toggleSidePanel: ()=>setView(view=>view==='sidePanel'? 'default' : 'sidePanel'),
        isNoteEditorVisible: view==='noteEditor',
        toggleNoteEditor: ()=>setView(view=>view==='noteEditor'? 'default' : 'noteEditor'),
        searchTerm: searchTerm,
        setSearchTerm: (newSearchTerm)=> setSearchTerm(newSearchTerm),
        noteList: noteList,
        setNoteList: setNoteList,
        noteToEdit:noteToEdit,
        setNoteToEdit:(note)=> setNoteToEdit(note),
        view:view,
    }
    //console.log('R. Provider...');
    //console.log(value);
    return ( noteList
        ? <Context.Provider value = {value}> {children} </Context.Provider> 
        : <div>loading....</div>
    );
}




const Copi = () => {
    // const {isNoteEditorVisible} = useContext(Context);
    return(
        <div>
            <DefaultProvider>
                <SidePanel/>
                <NoteEditorContainer/>
                <TagsEditorContainer/>
                <SearchBar/>
                <NoteList/>
                <BottomBar/>
            </DefaultProvider>
        </div>
    )
}//fin Copi

export default Copi;
