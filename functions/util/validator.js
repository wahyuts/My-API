// Validasi tulisan format email sudah benar apa belum
const isEmail = (email) => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regex)) return true;
    else return false;
  }

  // 
  const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
  }

  exports.validateSignupData = (data) => {
      //Validate form empty or not
  
    let errors = {};
  
    if(isEmpty(data.email)){
      errors.email = "Email must not be empty"
    } else if(!isEmail(data.email)){
      errors.email = "Must be a valid email address"
    }
  
    if(isEmpty(data.password)){
      errors.password = "Password must not be empty"
    }
  
    if(data.password !== data.confirmPassword) {
      errors.confirmPassword = "Password must match"
    }
  
    if(isEmpty(data.name)){
      errors.name = "name must not be empty"
    }

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
  }

  exports.validateSigninData = (data) => {
    let errors = {};
  
    if(isEmpty(data.email)){
      errors.email = "email must not be empty"
    }
  
    if(isEmpty(data.password)){
      errors.password = "password must not be empty"
    }
  
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
  }

  exports.reduceUserDetails = (data) => {
    let userDetails = {};

    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if(!isEmpty(data.website.trim())){
      if(data.website.trim().substring(0,4) !== 'http'){
        userDetails.website = `http://${data.website.trim()}`;
      } else userDetails.website = data.website;
    }
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;

    return userDetails;
  };