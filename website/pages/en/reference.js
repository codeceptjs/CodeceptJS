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
 const support = '<div className="alert alert-info">CodeceptJS has enterprise support: <a href="http://sdclabs.com/trainings/web-automation-codeceptjs?utm_source=codecept.io&utm_medium=top_menu&utm_term=link&utm_campaign=reference">trainings</a>, consulting, test automation. <a href="http://sdclabs.com/codeceptjs?utm_source=codecept.io&utm_medium=top_2&utm_term=link&utm_campaign=reference">Contact us at SDCLabs!</a></div>';

 function Reference(props) {
   const {config: siteConfig, language = ''} = props;
   return (
     <div className="docMainWrapper wrapper">
       <Container className="documentContainer postContainer referenceContainer">
       <div
        className="productShowcaseSection"
        style={{textAlign: 'left'}}>
        <h2>Reference</h2>
      </div>

        <DocsSidebar metadata={sidebar} ></DocsSidebar>
        <p className="pl-2 pb-4">Want some more? We have a nice set of <a href="https://github.com/Codeception/CodeceptJS/wiki/Community-Helpers">community helpers</a>. Check them out and add yours!</p>
       </Container>
     </div>
   );
 }

 module.exports = Reference;
