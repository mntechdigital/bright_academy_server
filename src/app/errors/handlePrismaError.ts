import { Prisma } from '@prisma/client';
import { TErrorSources, TGenericErrorResponse } from '../types/errors.type';

export const handlePrismaError = (
  error:
    | Prisma.PrismaClientKnownRequestError
    | Prisma.PrismaClientValidationError,
): TGenericErrorResponse => {
  let statusCode = 400;
  let message = '';
  let errorSources: TErrorSources = [
    {
      path: '',
      message: '',
    },
  ];

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2000':
        message =
          "The provided value for the column is too long for the column's type.";
        break;
      case 'P2001':
        message =
          'The record searched for in the where condition does not exist.';
        statusCode = 404;
        break;
      case 'P2002':
        message = 'Unique constraint failed.';
        break;
      case 'P2003':
        message = 'Foreign key constraint failed.';
        break;
      case 'P2004':
        message = 'A constraint failed on the database.';
        break;
      case 'P2005':
        message =
          "The value stored in the database for the field is invalid for the field's type.";
        break;
      case 'P2006':
        message = 'The provided value is not valid.';
        break;
      case 'P2007':
        message = 'Data validation error.';
        break;
      case 'P2008':
        message = 'Failed to parse the query.';
        break;
      case 'P2009':
        message = 'Failed to validate the query.';
        break;
      case 'P2010':
        message =
          'Raw query failed. Please check the query syntax and your database connection.';
        break;
      case 'P2011':
        message = 'Null constraint violation.';
        break;
      case 'P2012':
        message = 'Missing a required value.';
        break;
      case 'P2013':
        message = 'Missing the required argument.';
        break;
      case 'P2014':
        message =
          'The change you are trying to make would violate the required relation.';
        break;
      case 'P2015':
        message = 'A related record could not be found.';
        break;
      case 'P2016':
        message = 'Query interpretation error.';
        break;
      case 'P2017':
        message = 'The records for the relation are not connected.';
        break;
      case 'P2018':
        message = 'The required connected records were not found.';
        break;
      case 'P2019':
        message = 'Input error.';
        break;
      case 'P2020':
        message = 'Value out of range for the type.';
        break;
      case 'P2021':
        message = 'The table does not exist.';
        break;
      case 'P2022':
        message = 'The column does not exist.';
        break;
      case 'P2023':
        message = 'Inconsistent column data.';
        break;
      case 'P2024':
        message = 'Timed out while fetching data from the database.';
        break;
      case 'P2025':
        message = 'Record not found.';
        statusCode = 404;
        break;
      case 'P2026':
        message = 'Database not available.';
        break;
      case 'P2027':
        message = 'Multiple errors occurred.';
        break;
      case 'P2030':
        message = 'Cannot find a fulltext index to use for the search.';
        break;
      case 'P2031':
        message =
          'Prisma needs to perform a transaction, but it does not support the current database provider.';
        break;
      case 'P2033':
        message = 'An internal error occurred in the Prisma Client.';
        break;
      default:
        message = 'An unknown database error occurred';
        break;
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    errorSources = [{ path: '', message: 'Validation Error' }];
  }

  return { statusCode, message, errorSources };
};
