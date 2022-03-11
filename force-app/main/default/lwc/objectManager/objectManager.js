import { api, LightningElement, track } from 'lwc';
import getObjects from '@salesforce/apex/MetaDataAPI.getObjects';
import getFields from '@salesforce/apex/MetaDataAPI.getFields';
import doCallout from '@salesforce/apex/MetaDataAPI.doCallout';
import createObj from '@salesforce/apex/MetaDataAPI.createObj';
import createFie from '@salesforce/apex/MetaDataAPI.createFie';
const columns = [
    {
        label: 'CONFIG',
        type: "button",
        initialWidth: 140,
        typeAttributes: {
            label: 'Show Fields',
            name: 'fields',
            title: 'Show Fields',
            disabled: false,
            value: 'fields',
            iconPosition: 'left'
        }
    },
    { label: 'Name', fieldName: 'Label' },
    { label: 'API Name', fieldName: 'QualifiedApiName' },
];
export default class ObjectManager extends LightningElement {
    data = [];
    display = [];
    queryTerm;
    columns = columns;
    @track openModal = false;
    @track openFieldModal = false;
    fieldOptions = [{ label: 'Text', value: 'Text' },
    { label: 'Auto Number', value: 'AutoNumber' },
    { label: 'Checkbox', value: 'Checkbox' },
    { label: 'Date', value: 'Date' },
    { label: 'Number', value: 'Number' },
    { label: 'Time', value: 'Time' },
    { label: 'URL', value: 'Url' },
    { label: 'Email', value: 'Email' },
    { label: 'Phone', value: 'Phone' }];

    showfields = false;
    fieldHeading = ''
    loaded = true;
    loadedforObject = false;


    fields = [];
    displayfields = [];
    selectedObjectApiName = '';
    selectedObjectLabel='';

    customObjectLabel;
    customObjectApi;
    msg = '';


    fieldLabel;
    fieldApi;
    fieldType;
    connectedCallback() {
        getObjects()
            .then(result => {
                console.log(result);
                let temp = [];
                for (let item in result) {
                    temp.push({ Label: result[item].Label, QualifiedApiName: result[item].QualifiedApiName });
                }
                this.display = temp;
                this.data = temp;
                this.loadedforObject = true;
            })
            .catch(error => {
                console.log(result);
            })
    }
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'fields':
                this.showFields(row);
                break;
            default:
        }
    }
    handleKeyUp(evt) {
        this.loadedforObject = false;
        this.queryTerm = evt.target.value;
        if (this.queryTerm != null && this.queryTerm != undefined) {
            let temp = [];
            for (let item in this.data) {
                if (this.data[item].Label.startsWith(this.queryTerm)) {
                    temp.push(this.data[item]);
                }
            }
            this.display = temp;
        }
        else {
            this.display = this.data;
        }
        this.loadedforObject = true;
    }
    showFields(row) {
        let object = row.QualifiedApiName;
        this.selectedObjectApiName = object;
        this.selectedObjectLabel=row.Label;
        this.fieldHeading = row.Label;
        console.log('---->',this.selectedObjectApiName + ' '+ this.selectedObjectLabel);
        this.loaded = false;
        getFields({ selectedObject: object })
            .then(result => {
                console.log(result);
                let temp = [];
                for (let item in result) {
                    let bool = result[item][1] == "true" ? true : false;
                    temp.push({ Label: result[item][0], FieldApiName: item, custom: bool });
                }
                this.fields = temp;
                this.displayfields = temp;
                this.showfields = true;
                this.loaded = true;
                this.queryTerm = '';
                console.log(this.fields);
            })
            .catch(error => {
                console.log(error);
            })
    }
    handleBack(evt) {
        this.showfields = false;
        this.loadedforObject = false;
        this.display = this.data;
        this.fields = [];
        this.displayfields = [];
        this.fieldHeading = '';
        this.selectedObjectApiName = '';
        this.selectedObjectLabel='';
        this.loadedforObject = true;
    }
    handleChange(evt) {
        this.loaded = false;
        this.queryTerm = evt.target.value;
        if (this.queryTerm != null && this.queryTerm != undefined) {
            let temp = [];
            for (let item in this.fields) {
                if (this.fields[item].Label.startsWith(this.queryTerm)) {
                    temp.push(this.fields[item]);
                }
            }
            this.displayfields = temp;
        }
        else {
            this.displayfields = this.fields;
        }
        this.loaded = true;
    }
    handleDelete(evt) {
        var r = confirm("Are you Sure you want to Delete this field");
        if (r == true) {
            let fieldName = evt.target.name;
            console.log(fieldName);
            console.log(this.selectedObjectApiName);
            this.loaded = false;
            if (fieldName != null && fieldName != undefined && this.selectedObjectApiName != null && this.selectedObjectApiName != undefined) {
                doCallout({ objname: this.selectedObjectApiName, field: fieldName })
                    .then(result => {
                        console.log('Field Deleted');
                        let temp = [];
                        for (let each in this.fields) {
                            if (this.fields[each].FieldApiName !== fieldName) {
                                temp.push(this.fields[each])
                            }
                        }
                        this.fields = temp;
                        this.displayfields = temp;
                        this.queryTerm = '';
                        this.loaded = true;
                    })
                    .catch(error => {
                        console.log(error);
                    })
            }
        }

    }
    CreateCustomObject(evt) {
        if (this.customObjectApi != null && this.customObjectApi != undefined && this.customObjectApi != '' && this.customObjectLabel != '' && this.customObjectLabel != undefined && this.customObjectLabel != null) {
            console.log('create called');
            this.loadedforObject = false;
            createObj({ ApiName: this.customObjectApi, label: this.customObjectLabel })
                .then(result => {
                    console.log('created');
                    alert('Object Created');
                    getObjects()
                        .then(result => {
                            console.log(result);
                            let temp = [];
                            for (let item in result) {
                                temp.push({ Label: result[item].Label, QualifiedApiName: result[item].QualifiedApiName });
                            }
                            this.display = temp;
                            this.data = temp;
                        })
                        .catch(error => {
                            console.log(result);
                        })
                })
                .catch(error => {
                    console.log(error);
                })
            this.queryTerm = '';
            this.customObjectApi = '';
            this.customObjectLabel = '';
            this.loadedforObject = true;
            this.closeModal();
        }
    }
    handleFocus(evt) {
        let labelname = this.customObjectLabel;
        let apiname = '';
        var regex = /^[a-zA-Z ]+$/i;
        if (labelname != '' && labelname != undefined) {
            if ((!labelname.startsWith(' ')) && (!labelname.endsWith(' ')) && regex.test(labelname)) {
                console.log('Valid');
                apiname = labelname.replaceAll(' ', '_');
                apiname += '__c';
                console.log('apiname', apiname);
                this.customObjectApi = apiname;
                this.msg = '';
            }
            else {
                this.msg = 'Invalid Name should only contain characters and spaces';
            }
        }
    }
    CreateCustomField() {
        console.log('create custom field called');
        console.log(this.fieldLabel);
        console.log(this.fieldType);
        console.log(this.fieldApi);
        console.log(this.selectedObjectApiName);
        console.log(this.selectedObjectLabel);
        if (this.fieldLabel != undefined && this.fieldLabel != null
            && this.fieldLabel != '' && this.fieldType != undefined &&
            this.fieldType != null && this.fieldApi != undefined && this.fieldApi != null
            && this.fieldApi != '' && this.selectedObjectApiName != undefined && this.selectedObjectApiName != null) {
            console.log('create field called');
            this.loaded = false;
            createFie({ obj: this.selectedObjectApiName, objLabel : this.selectedObjectLabel ,fieldApiName: this.fieldApi, fieldLabel: this.fieldLabel, fieldType: this.fieldType , fieldLevelSecurity : true , pageLayout : true})
                .then(result => {
                    alert('Field Created with System admin as field level security and added to default page layout');
                    alert(this.selectedObjectApiName);
                    getFields({ selectedObject: this.selectedObjectApiName })
                        .then(result => {
                            console.log(result);
                            let temp = [];
                            for (let item in result) {
                                let bool = result[item][1] == "true" ? true : false;
                                temp.push({ Label: result[item][0], FieldApiName: item, custom: bool });
                            }
                            this.fields = temp;
                            this.displayfields = temp;
                            this.showfields = true;
                            this.loaded = true;
                        })
                        .catch(error => {
                            console.log(error);
                        })
                })
                .catch(error => {
                    console.log(error);
                })
            this.queryTerm = '';
            console.log(this.fields);
            this.closeFieldModal();
        }
    }
    showModal() {
        this.openModal = true;
    }
    closeModal() {
        this.openModal = false;
        this.customObjectLabel = undefined;
        this.customObjectApi = undefined;
    }
    handleInput(evt) {
        this.customObjectLabel = evt.detail.value;
    }
    showFieldModal() {
        this.openFieldModal = true;
    }
    closeFieldModal() {
        this.fieldType = undefined;
        this.fieldLabel = undefined;
        this.fieldApi = undefined;
        this.openFieldModal = false;
    }
    handleFieldLabel(evt) {
        this.fieldLabel = evt.detail.value;
    }
    handleFieldFocus(evt) {
        let fieldlabelName = this.fieldLabel;
        let fieldApiName = '';
        var regex = /^[a-zA-Z ]+$/i;
        if (fieldlabelName != '') {
            if ((!fieldlabelName.startsWith(' ')) && (!fieldlabelName.endsWith(' ')) && regex.test(fieldlabelName)) {
                console.log('Valid');
                fieldApiName = fieldlabelName.replaceAll(' ', '_');
                fieldApiName += '__c';
                console.log('fieldApiName', fieldApiName);
                this.fieldApi = fieldApiName;
                this.msg = '';
            }
            else {
                this.msg = 'Invalid Name!! Name should only contain characters and spaces';
            }
        }
    }
    handleType(evt) {
        this.fieldType = evt.detail.value;
    }
}