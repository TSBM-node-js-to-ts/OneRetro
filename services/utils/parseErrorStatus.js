export function parseErrorStatus(error, defaultStatus = 500) {
    return error?.statusCode && Number.isInteger(error.statusCode)
        ? error.statusCode
        : defaultStatus;
}
