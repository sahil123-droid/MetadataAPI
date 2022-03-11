public class MetaDataAPI {
    @AuraEnabled
    public static void doCallout(String objname,String field) {
        MetaDataAPI.deleteField(objname,field);
    }
    @AuraEnabled
    public static void createObj(String ApiName,String label){
        MetaDataAPI.createObject(ApiName,label);
    }
    @AuraEnabled
    public static void createFie(String obj ,String objLabel,String fieldApiName , String fieldLabel , String fieldType , boolean fieldLevelSecurity,boolean pageLayout){
        MetaDataAPI.createField(obj,objLabel,fieldApiName,fieldLabel,fieldType,fieldLevelSecurity,pageLayout);
    }
    @AuraEnabled
    public static List<Object> getObjects(){
        List<Object> lst = [SELECT Id, Label, MasterLabel, PluralLabel, DeveloperName, QualifiedApiName, KeyPrefix, NamespacePrefix FROM EntityDefinition WHERE IsCustomSetting = false Order by QualifiedApiName];
        return lst;
    }
    @AuraEnabled
    public static Map<String,List<String>> getFields(String selectedObject){
        System.debug(selectedObject);
        Map <String,Schema.SObjectType> gd = Schema.getGlobalDescribe();
        Schema.SObjectType sobjType = gd.get(selectedObject);
        Schema.DescribeSObjectResult r = sobjType.getDescribe();
        Map<String, Schema.SObjectField> MapofField = r.fields.getMap();
        
        Map<String,List<String>> result = new Map<String,List<String>>();
        
        for(String fieldName : MapofField.keySet()) {
            Schema.SObjectField field = MapofField.get(fieldName);
            Schema.DescribeFieldResult F = field.getDescribe();
            List<String> temp  = new List<String>();
            temp.add(F.label);
            temp.add(String.valueOf(F.custom));
            result.put(String.valueOf(field),temp);
        }
        System.debug(result);
        return result;
    }
    @future(callout=true)
    public static void updateFieldLevelSecurity(String obj,String field)
    {
        System.debug(obj+' '+field);
        MetadataService.MetadataPort metadataservice = new MetadataService.MetadataPort();
        metadataservice.SessionHeader = new MetadataService.SessionHeader_element();
        metadataservice.SessionHeader.sessionId = Utils.getSessionIdFromVFPage(Page.SessionId);
        MetadataService.Profile admin = new MetadataService.Profile();
        admin.fullName = 'Admin';
        admin.custom = false;
        MetadataService.ProfileFieldLevelSecurity fieldSec = new MetadataService.ProfileFieldLevelSecurity();
        fieldSec.field=obj+'.'+field;
        fieldSec.editable=true;
        admin.fieldPermissions  = new MetadataService.ProfileFieldLevelSecurity[] {fieldSec} ;
            metadataservice.updateMetadata(new MetadataService.Metadata[] { admin });
    }
    @future(callout=true)
    public static void deleteField(String objname,String field)
    {
        String param=objname+'.'+field;
        System.debug(param);
        MetadataService.MetadataPort metadataservice = new MetadataService.MetadataPort();
        metadataservice.SessionHeader = new MetadataService.SessionHeader_element();
        metadataservice.SessionHeader.sessionId = Utils.getSessionIdFromVFPage(Page.SessionId);
        metadataservice.deleteMetadata('CustomField', new String[] { param });
    }
    @future(callout=true)
    public static void createObject(String ApiName , String label)
    {
        MetadataService.MetadataPort metadataservice = new MetadataService.MetadataPort();
        metadataservice.SessionHeader = new MetadataService.SessionHeader_element();
        metadataservice.SessionHeader.sessionId = Utils.getSessionIdFromVFPage(Page.SessionId);
        MetadataService.CustomObject customObject = new MetadataService.CustomObject();
        customObject.fullName = ApiName;
        customObject.label = label;
        customObject.pluralLabel = label+'s';
        customObject.nameField = new MetadataService.CustomField();
        customObject.nameField.type_x = 'Text';
        customObject.nameField.label = 'Name';
        customObject.deploymentStatus = 'Deployed';
        customObject.sharingModel = 'ReadWrite';
        metadataservice.createMetadata(new MetadataService.Metadata[] { customObject });
    }
    @future(callout=true)
    public static void createField(String obj,String objLabel,String fieldApiName,String fieldLabel,String fieldType,boolean fieldLevelSecurity,boolean pageLayout)
    {
        System.debug('obj=>'+obj);
        System.debug('obj label =>'+objLabel);
        System.debug('api=>'+fieldApiName);
        System.debug('fieldLabel=>'+fieldLabel);
        System.debug('fieldType=>'+fieldType);
        System.debug('field level securty '+fieldLevelSecurity);
        System.debug('page layout '+pageLayout);
        
        MetadataService.MetadataPort metadataservice = new MetadataService.MetadataPort();
        metadataservice.SessionHeader = new MetadataService.SessionHeader_element();
        metadataservice.SessionHeader.sessionId = Utils.getSessionIdFromVFPage(Page.SessionId);
        MetadataService.CustomField customField = new MetadataService.CustomField();
        customField.fullName = obj+'.'+fieldApiName;
        customField.label = fieldLabel;
        if(fieldType == 'Text'){
            customField.type_x = fieldType;
            customField.length = 42;
        }
        else if(fieldType == 'Checkbox'){
            customField.type_x = fieldType;
            customField.defaultvalue='false';
        }
        else{
            customField.type_x = fieldType;
        }
        metadataservice.createMetadata(new MetadataService.Metadata[] { customField });
        if(fieldLevelSecurity == true){
            MetadataService.Profile admin = new MetadataService.Profile();
            admin.fullName = 'Admin';
            admin.custom = false;
            MetadataService.ProfileFieldLevelSecurity fieldSec = new MetadataService.ProfileFieldLevelSecurity();
            fieldSec.field=obj+'.'+fieldApiName;
            fieldSec.editable=true;
            admin.fieldPermissions  = new MetadataService.ProfileFieldLevelSecurity[] {fieldSec} ;
                metadataservice.updateMetadata(new MetadataService.Metadata[] { admin });
        }
        if(pageLayout == true){
            List<String> layoutList = new List<String>{obj+'-'+objLabel+' Layout'};
                List<Metadata.Metadata> components = Metadata.Operations.retrieve(Metadata.MetadataType.Layout, layoutList);
            Metadata.Layout la = (MetaData.Layout)components[0];
            Metadata.LayoutSection layoutSectionToEdit = null;
            List<Metadata.LayoutSection> layoutSections = la.layoutSections;
            if(obj.endsWith('__c')){
                for (Metadata.LayoutSection section : layoutSections) {
                    if (section.label == 'Information') {
                        layoutSectionToEdit = section;
                        break;
                    }
                }
            }
            else{
                for (Metadata.LayoutSection section : layoutSections) {
                    if (section.label == objLabel+' Information') {
                        layoutSectionToEdit = section;
                        break;
                    }
                }
            }
            List<Metadata.LayoutColumn> layoutColumns = layoutSectionToEdit.layoutColumns;     
            List<Metadata.LayoutItem> layoutItems = layoutColumns.get(0).layoutItems;
            // Create a new layout item for the custom field
            Metadata.LayoutItem item = new Metadata.LayoutItem();
            item.behavior = Metadata.UiBehavior.Edit;
            item.field = fieldApiName;
            layoutItems.add(item);
            
            Metadata.DeployContainer dc = new Metadata.DeployContainer();
            dc.addMetadata(la);
            
            Id jobid = Metadata.Operations.enqueueDeployment(dc,null);
        }
    }
}