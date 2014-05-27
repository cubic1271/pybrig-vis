pybrig-vis
==========

This project exists to offer a visualization of the output of the code found in _https://github.com/cubic1271/pybrig_.

All code here is completely client-side JS, which means that this code can access any data set to which the current
machine has access.

In other words, pointing a browser at https://shadow-of-enlightenment.com/pybrig, loading the application, and updating:

Settings => Base URL

to point at something like:

http://localhost:9200

should work perfectly fine (assuming, of course, the ES server has the CORS configuration to support this).

Note that, in the future, certain pieces of this code may use publicly available DNS / lookup tools to find additional information 
about e.g. MAC addresses, DNS names, IP addresses, etc.  Thus, if there's an aversion to sending this kind of data into the cloud,
please carefully review the code here before using it to view the results of your own benchmarks.

A recent copy of this code will be available for the near future at https://shadow-of-enlightenment.com/pybrig, but 
perpetual availability can't really be guaranteed.
