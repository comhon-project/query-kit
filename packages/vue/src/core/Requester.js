let requester;

const registerRequester = (req) => {
  requester = req;
};

export { registerRequester, requester };
