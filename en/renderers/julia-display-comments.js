/** Localise comments only in displayed shared Julia excerpts; executable source stays shared. */
const comments = {
  "# \u6807\u7b7ex/a/y\u4fdd\u63010/1\uff1b\u6570\u7ec4\u7d22\u5f15\u7531\u6807\u7b7e\u52a01\u3002q\u7684\u884c\u662fa\uff0c\u5217\u662fx\u3002": "# Keep x/a/y labels as 0/1; add 1 for array indices. Q rows index a and columns index x.",
  "# \u672c\u6a21\u5757\u53ea\u8bfb\u53d6\u8c03\u7528\u8005\u4f20\u5165\u7684\u8ba1\u6570\uff0c\u4e0d\u8bfb\u53d6JavaScript\u6559\u5b66\u6a21\u578b\u3002": "# This module reads only caller-supplied counts, rather than the JavaScript teaching model.",
  "# \u7b2c1\u8bb2\uff1a\u4ece\u805a\u5408\u4eba\u6570\u8ba1\u7b97\u4e8c\u5143\u5747\u503c\u3001\u5404\u89c2\u6d4b\u7ec4\u5408\u7684\u5f71\u54cd\u503c\u548c\u52a0\u6743\u5e73\u5747\u3002": "# Chapter 1: calculate the binary mean, cell influence values and weighted mean from grouped counts.",
  "# \u7b2c2\u8bb2\uff1at\u6539\u53d8\u4f4d\u7f6e\uff1bh\u3001score\u4e0e\u8d77\u70b9\u5bfc\u6570\u4e0d\u968ft\u6539\u53d8\u3002": "# Chapter 2: t selects the path position; h, score and the derivative at the starting point stay fixed.",
  "# \u4e0d\u622a\u65ad\uff1b\u8d85\u51fa\u5f53\u524d\u5168\u6b63\u6a21\u578b\u5c31\u5931\u8d25\u3002": "# No truncation: fail outside the current strictly positive probability model.",
  "# \u7b2c5\u8bb2\uff1a\u5728\u7ecf\u9a8c\u5168\u6a21\u578b\u7684\u8d77\u70b9\u9a8c\u8bc1ATE\u65b9\u5411\uff0c\u4e0d\u7528\u521d\u59cb\u9519\u8bbeQ\u4f2a\u88c5\u771f\u68af\u5ea6\u3002": "# Chapter 5: check the ATE gradient at the saturated empirical distribution; the initial fitted Q defines a different estimating function.",
  "# \u7b2c6\u8bb2\uff1a\u4ec5\u6b64\u7ec3\u4e60\u5c06\u8ba1\u6570\u4f30\u8ba1\u7684g\u5f53\u5df2\u77e5\u56fa\u5b9a\uff1b\u6700\u7ec8TMLE\u4ecd\u7531\u8f93\u5165\u8ba1\u6570\u5b66\u4e60g\u3002": "# Chapter 6: only this exercise treats the count-based g as known and fixed; the final TMLE still learns g from the counts.",
  "# \u7ec4\u7ed3\u679c\u7684H\u4e0eoffset\u5728\u66f4\u65b0\u9636\u6bb5\u624d\u8865\u5145\uff0c\u7b2c3\u8bb2\u8ba1\u6570\u6c47\u603b\u4e0d\u4f9d\u8d56\u5b83\u4eec\u3002": "# H and offset are added during updating; Chapter 3 count summaries do not depend on them.",
  "# \u5e73\u5747\u6761\u4ef6\u5bf9\u6570\u4f3c\u7136\u3001score\u53ca\u5176\u5bfc\u6570\uff0c\u5747\u53ea\u4f9d\u8d56\u89c2\u5bdf\u7ec4\u8ba1\u6570\u3002": "# The mean conditional log-likelihood, its score and its derivative depend only on observed group counts."
};
export function localiseJuliaComments(source) {
  return source.replace(/#[^\n]*/g, comment => {
    const translated = comments[comment] || comment;
    if (/[\u3400-\u9fff]/.test(translated)) throw Error('Untranslated shared Julia display comment');
    return translated;
  });
}
