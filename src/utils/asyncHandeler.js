const asyncHandeler = (requestHandeler) => {
  return (req, res, next) =>{
    Promise.resolve(requestHandeler(req, res, next))
    .catch((err) => next(err))
  }
}


export {asyncHandeler}


// const asyncHandeler =() =>{}
// const asyncHandeler =(func) =>{async () => {}}
// const asyncHandeler =(func) =>async () => {}

  // const asyncHandeler = (fn) => async(req, res, next) => {
  //   try {
  //     await func(req, res, next);
  //   } catch (error) {
  //     res.status(error.code || 400).json({
  //       success : false,
  //       message : error.message || 'Server Error'
  //     })
  //   }
  // }