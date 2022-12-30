const _ = require('lodash/fp')

/*
 * @brief Calls `Promise.all()` on the values of the given object
 * @param promisesObj An object whose values can be promises to be resolved
 * @returns A rejected promise, or a resolved promise of the updated object
 *          whose values are resolved
 */
const PromiseObject = promisesObj => {
  const [keys, promises] = _.unzip(_.toPairs(promisesObj))
  return Promise.all(promises)
    .then(_.flow(
      _.zip(keys),
      _.fromPairs,
    ))
}

module.exports = {
  PromiseObject,
}
