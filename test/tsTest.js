var test = require('unit.js');
var qdb = require('..');
var config = require('./config')

var cluster = new qdb.Cluster(config.cluster_uri);


describe('TimeSeries', function() {
	var ts
    before('connect', function(done) {
        cluster.connect(done, done);
    });

    before('init', function() {
        ts = cluster.ts("time_series");
    });

    it('should be of correct type', function() {
        test.object(ts).isInstanceOf(qdb.TimeSeries);
    });

    it("should have an 'alias' property", function() {
        test.object(ts).hasProperty('alias');
        test.must(ts.alias()).be.a.string();
    });

    describe('column info', function() {
		const doubleColName  = 'doubleCol'
		const blobColName  = 'blobCol'
        var d, b

        before('init', function() {
			d = qdb.DoubleColumnInfo(doubleColName);
			b = qdb.BlobColumnInfo(blobColName);
        });

        it('should have name property', function() {
			test.object(d).hasProperty('name')
			test.must(d.name).be.a.string();
			test.must(d.name).be.equal(doubleColName);

			test.object(b).hasProperty('name')
			test.must(b.name).be.a.string();
			test.must(b.name).be.equal(blobColName);
        });

        it('should have type property', function() {
			test.object(d).hasProperty('type')
			test.must(d.type).be.a.number();
			test.must(d.type).be.equal(qdb.TS_COLUMN_DOUBLE);

			test.object(b).hasProperty('type')
			test.must(b.type).be.a.number();
			test.must(b.type).be.equal(qdb.TS_COLUMN_BLOB);
        });

    }); // column info test

	describe('creation', function() {
		var columnInfo
		var emptyTs
		before('init', function() {
			columnInfo = qdb.DoubleColumnInfo('Col2')
		});

		after('creation', function(done) {
			emptyTs.remove(function(err) {
				test.must(err).be.equal(null);

				done();
			});
		});

		it('should create with empty columns', function(done) {
			emptyTs = cluster.ts("empty-ts")
			emptyTs.create([], function(err, columns) {
				test.must(err).be.equal(null);
				done();
			});
		});

		it('should create column', function(done) {
			ts.create([columnInfo], function(err, columns) {
				test.must(err).be.equal(null);

				done();
			});
		});

		it('should not create existing column', function(done) {
			ts.create([columnInfo], function(err, columns) {
				test.must(err).not.be.equal(null);
                test.must(err.message).be.a.string();
                test.must(err.message).not.be.empty();
                test.must(err.code).be.equal(qdb.E_ALIAS_ALREADY_EXISTS);
                test.must(err.severity).be.a.equal(qdb.E_SEVERITY_WARNING);
                test.must(err.origin).be.a.equal(qdb.E_ORIGIN_OPERATION);
                test.must(err.informational).be.false();

				done();
			});
		});

		it('should insert new columns', function(done) {
			ts.insert([qdb.DoubleColumnInfo("Colx"), qdb.BlobColumnInfo("Coly")], function(err, columns) {
				test.must(err).be.equal(null);

				done();
			});
		});

		it('should not insert existing columns', function(done) {
			ts.insert([qdb.DoubleColumnInfo("Colx"), qdb.BlobColumnInfo("ColZ")], function(err, columns) {
				test.must(err).not.be.equal(null);
                test.must(err.message).be.a.string();
                test.must(err.message).not.be.empty();
                test.must(err.code).be.equal(qdb.E_INVALID_ARGUMENT);
                test.must(err.severity).be.a.equal(qdb.E_SEVERITY_ERROR);
                test.must(err.origin).be.a.equal(qdb.E_ORIGIN_INPUT);
                test.must(err.informational).be.false();

				done();
			});
		});

		it('should not insert empty columns', function(done) {
			ts.insert([], function(err, columns) {
				test.must(err).not.be.equal(null);
                test.must(err.message).be.a.string();
                test.must(err.message).not.be.empty();
                test.must(err.code).be.equal(qdb.E_INVALID_ARGUMENT);
                test.must(err.severity).be.a.equal(qdb.E_SEVERITY_ERROR);
                test.must(err.origin).be.a.equal(qdb.E_ORIGIN_INPUT);
                test.must(err.informational).be.false();

				done();
			});
		});

		it('should remove time series', function(done) {
			ts.remove(function(err) {
				test.must(err).be.equal(null);

				done();
			});
		});


	}); // create test

	describe('columns', function() {
		var columnInfo
		var ts

		before('init', function(done) {
			columnInfo = [qdb.DoubleColumnInfo('Col1'), qdb.DoubleColumnInfo("Col2"), qdb.BlobColumnInfo("Col3")]
			ts = cluster.ts("list")

			ts.create([], function(err, columns) {
				test.must(err).be.equal(null);
				done();
			});
		});

		it('should return empty', function(done) {
			ts.columns(function(err, columns) {
				test.must(err).be.equal(null);
				test.must(columns.length).be.equal(0);
				done();
			});
		});

		it('should insert columns', function(done) {
			ts.insert(columnInfo, function(err, columns) {
				test.must(err).be.equal(null);

				done();
			});
		});

		it('should show columns', function(done) {
			ts.columns(function(err, columns) {
				test.must(err).be.equal(null);
				test.must(columns.length).be.equal(columnInfo.length);

				// FIXME: So far qdb returns columns in the same order as we
				// created them, but would be better if test compares using `indexof` or somthing like that
				for (var i = 0; i < columns.length; i++) {
					test.must(columns[i].name).be.equal(columnInfo[i].name);
					test.must(columns[i].type).be.equal(columnInfo[i].type);
				}

				done();
			});
		});

		it('should remove ts', function(done) {
			ts.remove(function(err){
				test.must(err).be.equal(null);

				done();
			});
		});

		it('should return error', function(done) {
			ts.columns(function(err, columns) {
				test.must(err).not.be.equal(null);
                test.must(err.message).be.a.string();
                test.must(err.message).not.be.empty();
                test.must(err.code).be.equal(qdb.E_ALIAS_NOT_FOUND);
                test.must(err.severity).be.a.equal(qdb.E_SEVERITY_WARNING);
                test.must(err.origin).be.a.equal(qdb.E_ORIGIN_OPERATION);
                test.must(err.informational).be.false();

				done();
			});
		});

	}); // list

	describe('points insert', function() {
		var ts = null
		var columns = null

		before('init', function(done) {
			var columnInfo = [qdb.DoubleColumnInfo('Col1'), qdb.BlobColumnInfo("Col2")]
			ts = cluster.ts("points")

			ts.create(columnInfo, function(err, cols) {
				test.must(err).be.equal(null);
				test.must(cols.Length).be.equal(columnInfo.Length);

				columns = cols;
				done();
			});
		});

		it('should create points', function() {
			var d1 = new Date(2049, 10, 5);
			var d2 = new Date(2049, 10, 5, 4);

			var v1 = 0.1
			var v2 = new Buffer("Hello there");

			var p1 = qdb.DoublePoint(d1, v1);
			var p2 = qdb.BlobPoint(d2, v2);

			test.object(p1).hasProperty('timestamp');
			test.object(p2).hasProperty('timestamp');

			test.must(p1.timestamp.getTime()).be.equal(d1.getTime());
			test.must(p2.timestamp.getTime()).be.equal(d2.getTime());

			test.object(p1).hasProperty('value')
			test.object(p2).hasProperty('value')

			test.must(p1.value).be.equal(v1);
			test.must(p2.value.compare(v2)).be.equal(0);

		});

		it('should hold blob Buffer', function(){
			var d = new Date(2049, 10, 5, 4);
			var v = new Buffer("Hello there");
			var p = qdb.BlobPoint(d, v);

			test.must(p.value.compare(v)).be.equal(0)
		});

		it('should insert double point', function(done) {
			var p = qdb.DoublePoint(new Date(2049, 10, 5), 0.4);
			columns[0].insert([p], function(err) {
				test.must(err).be.equal(null);

				done();
			});
		});

		it('should insert multiple double points', function(done) {
			var points = [qdb.DoublePoint(new Date(2049, 10, 5, 1), 0.4),
				qdb.DoublePoint(new Date(2049, 10, 5, 2), 0.5),
				qdb.DoublePoint(new Date(2049, 10, 5, 3), 0.6)];

			columns[0].insert(points, function(err) {
				test.must(err).be.equal(null);

				done();
			});
		});

		it('should not insert double point into blob column', function(done) {
			var p = qdb.BlobPoint(new Date(2049, 10, 5, 4), new Buffer("Hello"));
			columns[1].insert([p], function(err) {
				test.must(err).be.equal(null);

				done();
			});
		});

		it('should insert blob point', function(done) {
			var p = qdb.BlobPoint(new Date(2049, 10, 6, 4), new Buffer("Well "));
			columns[1].insert([p], function(err) {
				test.must(err).be.equal(null);

				done();
			});
		});

		it('should insert multiple blob points', function(done) {
			var points = [qdb.BlobPoint(new Date(2049, 10, 6, 4), new Buffer("hello ")),
				qdb.BlobPoint(new Date(2049, 10, 6, 4), new Buffer("there ")),
				qdb.BlobPoint(new Date(2049, 10, 6, 4), new Buffer("Decard"))];

			columns[1].insert(points, function(err) {
				test.must(err).be.equal(null);

				done();
			});
		});

		it('should not insert blob point into double column', function(done) {
			var p = qdb.DoublePoint(new Date(2049, 10, 7, 4), 13.37);
			columns[1].insert([p], function(err) {
				test.must(err).not.be.equal(null);

				done();
			});
		});

	}); // points insert

	describe('ranges', function() {
		var ts = null
		var columns = null
		var doublePoints = null
		var blobPoints = null

		before('init', function(done) {
			var columnInfo = [qdb.DoubleColumnInfo('doubles'), qdb.BlobColumnInfo("blobs")]
			ts = cluster.ts("ranges")

			ts.create(columnInfo, function(err, cols) {
				test.must(err).be.equal(null);
				test.must(cols.Length).be.equal(columnInfo.Length);

				columns = cols;
				done();
			});
		});

		it('should insert double points', function(done) {
			doublePoints = [
				qdb.DoublePoint(new Date(2030, 10, 5, 6), 0.1 ),
				qdb.DoublePoint(new Date(2030, 10, 5, 7), 0.2 ),
				qdb.DoublePoint(new Date(2030, 10, 5, 8), 0.3 ),

				qdb.DoublePoint(new Date(2049, 10, 5, 1), 0.4 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 2), 0.5 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 3), 0.6 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 4), 0.7 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 5), 0.8 ),
			];

			columns[0].insert(doublePoints, function(err) {
				test.must(err).be.equal(null);
				done();
			});
		});

		it('should insert blob points', function(done) {
			blobPoints = [
				qdb.BlobPoint(new Date(2030, 10, 5, 6), new Buffer("#6")),
				qdb.BlobPoint(new Date(2030, 10, 5, 7), new Buffer("#7")),
				qdb.BlobPoint(new Date(2030, 10, 5, 8), new Buffer("#8")),

				qdb.BlobPoint(new Date(2049, 10, 5, 1), new Buffer("#1")),
				qdb.BlobPoint(new Date(2049, 10, 5, 2), new Buffer("#2")),
				qdb.BlobPoint(new Date(2049, 10, 5, 3), new Buffer("#3")),
				qdb.BlobPoint(new Date(2049, 10, 5, 4), new Buffer("#4")),
				qdb.BlobPoint(new Date(2049, 10, 5, 5), new Buffer("#5")),
			];

			columns[1].insert(blobPoints, function(err) {
				test.must(err).be.equal(null);
				done();
			});
		});

		it('should create valid range', function() {
			var begin = new Date(2049, 10, 5, 1);
			var end = new Date(2049, 10, 5, 3);
			var range = ts.Range(begin, end);

			test.object(range).hasProperty('begin');
			test.object(range).hasProperty('end');

			test.must(range.begin.getTime()).be.equal(begin.getTime());
			test.must(range.end.getTime()).be.equal(end.getTime());
		});

		it('should retrieve nothing', function(done) {
			var begin = new Date(2000, 10, 5, 2);
			var end = new Date(2020, 10, 5, 4);
			var range = ts.Range(begin, end);

			columns[0].ranges([range], function(err, points) {
				test.must(err).be.equal(null);
				test.must(points.length).be.equal(0);

				done();
			});
		});

		it('should retrieve double points in range', function(done) {
			var begin = new Date(2049, 10, 5, 2);
			var end = new Date(2049, 10, 5, 4);
			var range = ts.Range(begin, end);

			columns[0].ranges([range], function(err, points) {
				test.must(err).be.equal(null);

				exp = doublePoints.slice(4, 6);
				test.array(points).is(exp);
				done();
			});
		});

		it('should retrieve double points in all ranges', function(done) {
			var b1 = new Date(2049, 10, 5, 2);
			var e1 = new Date(2049, 10, 5, 4);
			var b2 = new Date(2030, 10, 5, 7);
			var e2 = new Date(2030, 10, 5, 8);
			var ranges = [ts.Range(b1, e1), ts.Range(b2, e2)];

			columns[0].ranges(ranges, function(err, points) {
				test.must(err).be.equal(null);

				exp = doublePoints.slice(1, 2).concat(doublePoints.slice(4, 6));
				test.array(points).is(exp);
				done();
			});
		});

		it('should retrieve all double points', function(done) {
			var begin = new Date(2000, 10, 5, 2);
			var end = new Date(2049, 10, 5, 10);
			var range = ts.Range(begin, end);

			columns[0].ranges([range], function(err, points) {
				test.must(err).be.equal(null);
				test.array(points).is(doublePoints);

				done();
			});
		});

		var blobsCheck = function(exp, act) {
			test.must(exp.length).be.equal(act.length);

			for (var i = 0; i < act.length; i++) {
				e = exp[i];
				a = act[i];
				test.must(e.timestamp.getTime()).be.equal(a.timestamp.getTime());
				test.must(e.value.compare(a.value)).be.equal(0);
			}
		}

		it('should retrieve blob points in range', function(done) {
			var begin = new Date(2049, 10, 5, 2);
			var end = new Date(2049, 10, 5, 4);
			var range = ts.Range(begin, end);

			columns[1].ranges([range], function(err, points) {
				test.must(err).be.equal(null);

				exp = blobPoints.slice(4, 6);
				blobsCheck(exp, points);
				done();
			});
		});

		it('should retrieve blob points in all ranges', function(done) {
			var b1 = new Date(2049, 10, 5, 2);
			var e1 = new Date(2049, 10, 5, 4);
			var b2 = new Date(2030, 10, 5, 7);
			var e2 = new Date(2030, 10, 5, 8);
			var ranges = [ts.Range(b1, e1), ts.Range(b2, e2)];

			columns[1].ranges(ranges, function(err, points) {
				test.must(err).be.equal(null);

				exp = blobPoints.slice(1, 2).concat(blobPoints.slice(4, 6));
				blobsCheck(exp, points);
				done();
			});
		});

		it('should retrieve all blob points', function(done) {
			var begin = new Date(2000, 10, 5, 2);
			var end = new Date(2049, 10, 5, 10);
			var range = ts.Range(begin, end);

			columns[1].ranges([range], function(err, points) {
				test.must(err).be.equal(null);

				blobsCheck(blobPoints, points);
				done();
			});
		});

		it('should erase ranges of double points', function(done) {
			var b1 = new Date(2030, 10, 5, 6);
			var e1 = new Date(2030, 10, 5, 10);
			var b2 = new Date(2049, 10, 5, 5);
			var e2 = new Date(2049, 10, 5, 6);
			var ranges = [ts.Range(b1, e1), ts.Range(b2, e2)];

			columns[0].erase(ranges, function(err, erased) {
				test.must(err).be.equal(null);
				test.must(erased).be.equal(4);

				done();
			});
		});

		it('should erase ranges of blob points', function(done) {
			var b1 = new Date(2030, 10, 5, 6);
			var e1 = new Date(2030, 10, 5, 10);
			var b2 = new Date(2049, 10, 5, 5);
			var e2 = new Date(2049, 10, 5, 6);
			var ranges = [ts.Range(b1, e1), ts.Range(b2, e2)];

			columns[1].erase(ranges, function(err, erased) {
				test.must(err).be.equal(null);
				test.must(erased).be.equal(4);

				done();
			});
		});

		it('should retrieve all remaining double points', function(done) {
			var begin = new Date(2000, 10, 5, 2);
			var end = new Date(2049, 10, 5, 10);
			var range = ts.Range(begin, end);

			columns[0].ranges([range], function(err, points) {
				test.must(err).be.equal(null);

				exp = doublePoints.slice(3, 7);
				test.array(points).is(exp);

				done();
			});
		});

		it('should retrieve all remaining blob points', function(done) {
			var begin = new Date(2000, 10, 5, 2);
			var end = new Date(2049, 10, 5, 10);
			var range = ts.Range(begin, end);

			columns[1].ranges([range], function(err, points) {
				test.must(err).be.equal(null);

				exp = blobPoints.slice(3, 7);
				blobsCheck(exp, points);

				done();
			});
		});
	}); // Ranges

	describe('aggregations', function() {
		var ts = null
		var columns = null
		var doublePoints = null
		var blobPoints = null

		before('init', function(done) {
			var columnInfo = [qdb.DoubleColumnInfo('doubles'), qdb.BlobColumnInfo("blobs")]
			ts = cluster.ts("aggregations")

			ts.create(columnInfo, function(err, cols) {
				test.must(err).be.equal(null);
				test.must(cols.Length).be(columnInfo.Length);

				columns = cols;
				done();
			});
		});

		it('should insert double points', function(done) {
			doublePoints = [
				qdb.DoublePoint(new Date(2049, 10, 5, 1), 0.1 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 2), 0.2 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 3), 0.3 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 4), 0.4 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 5), 0.5 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 6), 0.1 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 7), 0.2 ),
				qdb.DoublePoint(new Date(2049, 10, 5, 8), 0.3 ),
			];

			columns[0].insert(doublePoints, function(err) {
				test.must(err).be.equal(null);
				done();
			});
		});

		it('should insert blob points', function(done) {
			blobPoints = [
				qdb.BlobPoint(new Date(2049, 10, 5, 1), new Buffer("#1")),
				qdb.BlobPoint(new Date(2049, 10, 5, 2), new Buffer("#2")),
				qdb.BlobPoint(new Date(2049, 10, 5, 3), new Buffer("#3")),
				qdb.BlobPoint(new Date(2049, 10, 5, 4), new Buffer("#4")),
				qdb.BlobPoint(new Date(2049, 10, 5, 5), new Buffer("#5")),
				qdb.BlobPoint(new Date(2049, 10, 5, 6), new Buffer("#6")),
				qdb.BlobPoint(new Date(2049, 10, 5, 7), new Buffer("#7")),
				qdb.BlobPoint(new Date(2049, 10, 5, 8), new Buffer("#8")),

			];

			columns[1].insert(blobPoints, function(err) {
				test.must(err).be.equal(null);
				done();
			});
		});

		it('should create valid aggregation', function() {
			var range = ts.Range(new Date(2049, 10, 5, 1), new Date(2049, 10, 5, 12));
			var agg = qdb.TsAggregation(qdb.AggFirst, range)
			var aggc = qdb.TsAggregation(qdb.AggLast, range, 42)

			test.object(agg).hasProperty('type');
			test.object(agg).hasProperty('range');
			test.object(agg).hasProperty('count');

			test.must(agg.type).be(qdb.AggFirst);
			test.must(aggc.type).be(qdb.AggLast);

			test.must(agg.range).be(range);
			test.must(agg.count).eql(0);
			test.must(aggc.count).eql(42);
		});

		it('should find first and last points', function(done) {
			var range = ts.Range(new Date(2049, 10, 5, 1), new Date(2049, 10, 5, 12));
			var first = qdb.TsAggregation(qdb.AggFirst, range)
			var last = qdb.TsAggregation(qdb.AggLast, range)

			columns[0].aggregate([first, last], function(err, results) {
				test.must(err).be.equal(null);
				test.must(results).not.be.equal(null);
				test.must(results.length).be(2);

				var act = doublePoints[0];
				test.must(results[0]).eql(act);

				act = doublePoints[doublePoints.length-1];
				test.must(results[1]).eql(act);

				done();
			});
		});
	}); // Aggregations

}); // time series
