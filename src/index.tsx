import React, { useEffect, useRef } from 'react';
import MaterialTable, { MaterialTableProps, Column, Components, Localization, Icons, Options, MTableEditField, MTableBodyRow } from 'material-table';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { Formik, Form, Field, FormikErrors } from 'formik';
import { CircularProgress, makeStyles, DialogContentText } from '@material-ui/core';

const useStyles = makeStyles({
  field: {
    padding: 8
  }
});

interface IData extends Object {
  tableData?: {};
}

interface IFormikWrapperProps<RowData extends IData> extends MaterialTableProps<RowData> {
  validate?: (value: RowData) => void | object | Promise<FormikErrors<RowData>>;
  validationSchema?: any | (() => any);
  localization?: IWrapperLocalization;
}

interface IWrapperLocalization extends Localization {
  deleteHeader?: string;
  deleteAction?: string;
}


function FormikWrapper<RowData extends IData>(props: IFormikWrapperProps<RowData>) {

  const { localization, components, validate, validationSchema } = props;

  const dialogLocalisation = {
    addTooltip: localization && localization.body ? localization.body.addTooltip || 'Add Row' : 'Add Row',
    editTooltip: localization && localization.body ? localization.body.editTooltip || 'Edit Row' : 'Edit Row',
    deleteHeader: localization ? localization.deleteHeader || 'Delete Row' : 'Delete Row',
    deleteAction: localization ? localization.deleteAction || 'Delete' : 'Delete'
  };

  const editField = components?.EditField || MTableEditField;
  return <MaterialTable
    {...props}
    components={{
      ...components,
      EditRow: editProps => <FormikDialog
        {...editProps}
        editField={editField}
        dialogLocalisation={dialogLocalisation}
        validate={validate}
        validationSchema={validationSchema} />
    }}
  />
};

interface IFormikDialogProps<RowData extends IData> {
  children?: JSX.Element;
  validate?: (values: RowData) => void | object | Promise<FormikErrors<RowData>>;
  validationSchema?: any | (() => any);
  dialogLocalisation: {
    addTooltip: string;
    editTooltip: string;
    deleteHeader: string;
    deleteAction: string;
  }
  editField: () => React.ReactElement<any>;
  columns: Column<RowData>[];
  data?: RowData;
  components: Components;
  icons: Icons;
  mode: 'add' | 'update' | 'delete';
  localization: {
    saveTooltip: string;
    cancelTooltip: string;
    deleteText: string;
  };
  options: Options;
  isTreeData: boolean;
  detailPanel: undefined;
  onEditingCanceled: (mode: 'add' | 'update' | 'delete', rowData?: RowData) => Promise<void>;
  onEditingApproved: (mode: 'add' | 'update' | 'delete', newDate: RowData, oldData: RowData | undefined) => Promise<void>;
  getFieldValue: (rowData: RowData, columnDef: unknown) => string | number;
}


function FormikDialog<RowData extends IData>({ children, onEditingCanceled, validate, onEditingApproved, validationSchema, mode, editField: EditCell, dialogLocalisation, ...props }: IFormikDialogProps<RowData>) {

  const { localization, data, columns } = props;

  const classes = useStyles();

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const closeDialog = () => { onEditingCanceled(mode, data); };

  let title;
  switch (mode) {
    case 'add':
      title = dialogLocalisation.addTooltip;
      break;
    case 'update':
      title = dialogLocalisation.editTooltip;
      break;
    case 'delete':
      title = dialogLocalisation.deleteHeader;
      break;
  }
  return <>
    <Dialog onClose={closeDialog} open={true} fullWidth={true}>
      <DialogTitle id="simple-dialog-title">{title}</DialogTitle>
      <Formik
        validationSchema={validationSchema}
        initialValues={data ? { ...data } : {} as RowData}
        validate={validate}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true)
          delete values.tableData;
          await onEditingApproved(mode, values, data);
          if (mounted && mounted.current) {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <DialogContent>
              {mode !== 'delete' &&
                columns.map(column => (<Field
                  key={column.field}
                  name={column.field}>
                  {({ field, meta }: any) => <div className={classes.field}>
                    <label htmlFor={column.field as string}>{column.title}</label>
                    <EditCell
                      {...field}
                      error={meta.touched && meta.error}
                      fullWidth={true}
                      id={column.field}
                      helperText={meta.touched && meta.error}
                      columnDef={column}
                      onChange={(newValue: string | number | boolean) => field.onChange({ target: { value: newValue, checked: newValue, name: field.name } })}
                      rowData={data} />
                  </div>
                  }
                </Field>))
              }
              {mode === 'delete' &&
                <DialogContentText>
                  {localization.deleteText}
                </DialogContentText>
              }
              <DialogActions>
                {
                  isSubmitting ? <CircularProgress size={25} /> : <>
                    <Button onClick={closeDialog} color="primary">
                      {localization.cancelTooltip}
                    </Button>
                    <Button color="primary" autoFocus type="submit">
                      {mode !== 'delete' ? localization.saveTooltip : dialogLocalisation.deleteAction}
                    </Button>
                  </>
                }
              </DialogActions>
            </DialogContent>
          </Form>
        )}
      </Formik>
    </Dialog >
    {data && <MTableBodyRow {...props} onToggleDetailPanel={() => { }}>
      {children}
    </MTableBodyRow>}
  </>;
}

export default FormikWrapper;