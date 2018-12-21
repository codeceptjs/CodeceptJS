let sidebar = { id: 'reference',
  title: 'Reference',
  language: 'en',
  sidebar: 'reference',
  category: 'Reference',
  subcategory: null,
  order: 2
 }



 const React = require('react');

 const CompLibrary = require('../../core/CompLibrary.js');
 const DocsSidebar = require('../../core/DocsSidebar.js');

 const Container = CompLibrary.Container;
 const GridBlock = CompLibrary.GridBlock;

 function Reference(props) {
   const {config: siteConfig, language = ''} = props;
   return (
     <div className="docMainWrapper wrapper">
       <Container className="documentContainer postContainer referenceContainer">
        <DocsSidebar metadata={sidebar} ></DocsSidebar>
       </Container>
     </div>
   );
 }

 module.exports = Reference;
