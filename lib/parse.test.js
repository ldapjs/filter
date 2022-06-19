// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.
// Copyright 2016 Joyent, Inc.
'use strict'

const tap = require('tap')

const { parse } = require('./index')
const ExtensibleFilter = require('./filters/extensible')

function checkFilters (t, filters) {
  filters.forEach(function (filter) {
    const f = parse(filter.str)
    t.ok(f, 'Parsed "' + filter.str + '"')
    t.equal(f.type, filter.type)
    t.equal(f.attribute, 'foo')
    t.equal(f.value, filter.val)
    t.equal(f.toString(), filter.output)
  })
  t.end()
}

/// --- Tests

tap.test('XML Strings in filter', function (t) {
  const str = '(&(CentralUIEnrollments=<mydoc>*)(objectClass=User))'
  const f = parse(str)
  t.ok(f)
  t.ok(f.filters)
  t.equal(f.filters.length, 2)
  f.filters.forEach(function (filter) {
    t.ok(filter.attribute)
  })
  t.end()
})

tap.test('= in filter', function (t) {
  const str = '(uniquemember=uuid=930896af-bf8c-48d4-885c-6573a94b1853, ' +
    'ou=users, o=smartdc)'
  const f = parse(str)
  t.ok(f)
  t.equal(f.attribute, 'uniquemember')
  t.equal(f.value,
    'uuid=930896af-bf8c-48d4-885c-6573a94b1853, ou=users, o=smartdc')
  t.equal(f.toString(),
    '(uniquemember=uuid=930896af-bf8c-48d4-885c-6573a94b1853, ' +
    'ou=users, o=smartdc)')
  t.end()
})

tap.test('( in filter', function (t) {
  const str = 'foo=bar\\28'
  const f = parse(str)
  t.ok(f)
  t.equal(f.attribute, 'foo')
  t.equal(f.value, 'bar(')
  t.equal(f.toString(), '(foo=bar\\28)')
  t.end()
})

tap.test(') in filter', function (t) {
  const str = '(foo=bar\\29)'
  const f = parse(str)
  t.ok(f)
  t.equal(f.attribute, 'foo')
  t.equal(f.value, 'bar)')
  t.equal(f.toString(), '(foo=bar\\29)')
  t.end()
})

tap.test('() in filter', function (t) {
  const str = 'foobar=baz\\28\\29'
  const f = parse(str)
  t.ok(f)
  t.equal(f.attribute, 'foobar')
  t.equal(f.value, 'baz()')
  t.equal(f.toString(), '(foobar=baz\\28\\29)')
  const f2 = parse(f.toString())
  t.equal(f.toString(), f2.toString())
  t.end()
})

tap.test(')( in filter', function (t) {
  const str = 'foobar=baz\\29\\28'
  const f = parse(str)
  t.ok(f)
  t.equal(f.attribute, 'foobar')
  t.equal(f.value, 'baz)(')
  t.equal(f.toString(), '(foobar=baz\\29\\28)')
  t.end()
})

tap.test('newlines in filter', function (t) {
  const v1 = '\n'
  const v2 = 'bar\n'
  const v3 = '\nbar'
  checkFilters(t, [
    { str: '(foo=\n)', type: 'EqualityFilter', val: v1, output: '(foo=\\0a)' },
    { str: '(foo<=\n)', type: 'le', val: v1, output: '(foo<=\\0a)' },
    { str: '(foo>=\n)', type: 'ge', val: v1, output: '(foo>=\\0a)' },
    { str: '(foo=\\0a)', type: 'EqualityFilter', val: v1, output: '(foo=\\0a)' },
    { str: '(foo<=\\0a)', type: 'le', val: v1, output: '(foo<=\\0a)' },
    { str: '(foo>=\\0a)', type: 'ge', val: v1, output: '(foo>=\\0a)' },
    { str: '(foo=bar\n)', type: 'EqualityFilter', val: v2, output: '(foo=bar\\0a)' },
    { str: '(foo<=bar\n)', type: 'le', val: v2, output: '(foo<=bar\\0a)' },
    { str: '(foo>=bar\n)', type: 'ge', val: v2, output: '(foo>=bar\\0a)' },
    { str: '(foo=bar\\0a)', type: 'EqualityFilter', val: v2, output: '(foo=bar\\0a)' },
    { str: '(foo<=bar\\0a)', type: 'le', val: v2, output: '(foo<=bar\\0a)' },
    { str: '(foo>=bar\\0a)', type: 'ge', val: v2, output: '(foo>=bar\\0a)' },
    { str: '(foo=\nbar)', type: 'EqualityFilter', val: v3, output: '(foo=\\0abar)' },
    { str: '(foo<=\nbar)', type: 'le', val: v3, output: '(foo<=\\0abar)' },
    { str: '(foo>=\nbar)', type: 'ge', val: v3, output: '(foo>=\\0abar)' },
    { str: '(foo=\\0abar)', type: 'EqualityFilter', val: v3, output: '(foo=\\0abar)' },
    { str: '(foo<=\\0abar)', type: 'le', val: v3, output: '(foo<=\\0abar)' },
    { str: '(foo>=\\0abar)', type: 'ge', val: v3, output: '(foo>=\\0abar)' }
  ])
})

tap.test('carriage returns in filter', function (t) {
  const v1 = '\r'
  const v2 = 'bar\r'
  const v3 = '\rbar'
  checkFilters(t, [
    { str: '(foo=\r)', type: 'EqualityFilter', val: v1, output: '(foo=\\0d)' },
    { str: '(foo<=\r)', type: 'le', val: v1, output: '(foo<=\\0d)' },
    { str: '(foo>=\r)', type: 'ge', val: v1, output: '(foo>=\\0d)' },
    { str: '(foo=\\0d)', type: 'EqualityFilter', val: v1, output: '(foo=\\0d)' },
    { str: '(foo<=\\0d)', type: 'le', val: v1, output: '(foo<=\\0d)' },
    { str: '(foo>=\\0d)', type: 'ge', val: v1, output: '(foo>=\\0d)' },
    { str: '(foo=bar\r)', type: 'EqualityFilter', val: v2, output: '(foo=bar\\0d)' },
    { str: '(foo<=bar\r)', type: 'le', val: v2, output: '(foo<=bar\\0d)' },
    { str: '(foo>=bar\r)', type: 'ge', val: v2, output: '(foo>=bar\\0d)' },
    { str: '(foo=bar\\0d)', type: 'EqualityFilter', val: v2, output: '(foo=bar\\0d)' },
    { str: '(foo<=bar\\0d)', type: 'le', val: v2, output: '(foo<=bar\\0d)' },
    { str: '(foo>=bar\\0d)', type: 'ge', val: v2, output: '(foo>=bar\\0d)' },
    { str: '(foo=\rbar)', type: 'EqualityFilter', val: v3, output: '(foo=\\0dbar)' },
    { str: '(foo<=\rbar)', type: 'le', val: v3, output: '(foo<=\\0dbar)' },
    { str: '(foo>=\rbar)', type: 'ge', val: v3, output: '(foo>=\\0dbar)' },
    { str: '(foo=\\0dbar)', type: 'EqualityFilter', val: v3, output: '(foo=\\0dbar)' },
    { str: '(foo<=\\0dbar)', type: 'le', val: v3, output: '(foo<=\\0dbar)' },
    { str: '(foo>=\\0dbar)', type: 'ge', val: v3, output: '(foo>=\\0dbar)' }
  ])
})

tap.test('tabs in filter', function (t) {
  const v1 = '\t'
  const v2 = 'bar\t'
  const v3 = '\tbar'
  checkFilters(t, [
    { str: '(foo=\t)', type: 'EqualityFilter', val: v1, output: '(foo=\\09)' },
    { str: '(foo<=\t)', type: 'le', val: v1, output: '(foo<=\\09)' },
    { str: '(foo>=\t)', type: 'ge', val: v1, output: '(foo>=\\09)' },
    { str: '(foo=\\09)', type: 'EqualityFilter', val: v1, output: '(foo=\\09)' },
    { str: '(foo<=\\09)', type: 'le', val: v1, output: '(foo<=\\09)' },
    { str: '(foo>=\\09)', type: 'ge', val: v1, output: '(foo>=\\09)' },
    { str: '(foo=bar\t)', type: 'EqualityFilter', val: v2, output: '(foo=bar\\09)' },
    { str: '(foo<=bar\t)', type: 'le', val: v2, output: '(foo<=bar\\09)' },
    { str: '(foo>=bar\t)', type: 'ge', val: v2, output: '(foo>=bar\\09)' },
    { str: '(foo=bar\\09)', type: 'EqualityFilter', val: v2, output: '(foo=bar\\09)' },
    { str: '(foo<=bar\\09)', type: 'le', val: v2, output: '(foo<=bar\\09)' },
    { str: '(foo>=bar\\09)', type: 'ge', val: v2, output: '(foo>=bar\\09)' },
    { str: '(foo=\tbar)', type: 'EqualityFilter', val: v3, output: '(foo=\\09bar)' },
    { str: '(foo<=\tbar)', type: 'le', val: v3, output: '(foo<=\\09bar)' },
    { str: '(foo>=\tbar)', type: 'ge', val: v3, output: '(foo>=\\09bar)' },
    { str: '(foo=\\09bar)', type: 'EqualityFilter', val: v3, output: '(foo=\\09bar)' },
    { str: '(foo<=\\09bar)', type: 'le', val: v3, output: '(foo<=\\09bar)' },
    { str: '(foo>=\\09bar)', type: 'ge', val: v3, output: '(foo>=\\09bar)' }
  ])
})

tap.test('spaces in filter', function (t) {
  const v1 = ' '
  const v2 = 'bar '
  const v3 = ' bar'
  checkFilters(t, [
    { str: '(foo= )', type: 'EqualityFilter', val: v1, output: '(foo= )' },
    { str: '(foo<= )', type: 'le', val: v1, output: '(foo<= )' },
    { str: '(foo>= )', type: 'ge', val: v1, output: '(foo>= )' },
    { str: '(foo=\\20)', type: 'EqualityFilter', val: v1, output: '(foo= )' },
    { str: '(foo<=\\20)', type: 'le', val: v1, output: '(foo<= )' },
    { str: '(foo>=\\20)', type: 'ge', val: v1, output: '(foo>= )' },
    { str: '(foo=bar )', type: 'EqualityFilter', val: v2, output: '(foo=bar )' },
    { str: '(foo<=bar )', type: 'le', val: v2, output: '(foo<=bar )' },
    { str: '(foo>=bar )', type: 'ge', val: v2, output: '(foo>=bar )' },
    { str: '(foo=bar\\20)', type: 'EqualityFilter', val: v2, output: '(foo=bar )' },
    { str: '(foo<=bar\\20)', type: 'le', val: v2, output: '(foo<=bar )' },
    { str: '(foo>=bar\\20)', type: 'ge', val: v2, output: '(foo>=bar )' },
    { str: '(foo= bar)', type: 'EqualityFilter', val: v3, output: '(foo= bar)' },
    { str: '(foo<= bar)', type: 'le', val: v3, output: '(foo<= bar)' },
    { str: '(foo>= bar)', type: 'ge', val: v3, output: '(foo>= bar)' },
    { str: '(foo=\\20bar)', type: 'EqualityFilter', val: v3, output: '(foo= bar)' },
    { str: '(foo<=\\20bar)', type: 'le', val: v3, output: '(foo<= bar)' },
    { str: '(foo>=\\20bar)', type: 'ge', val: v3, output: '(foo>= bar)' }
  ])
})

tap.test('literal \\ in filter', function (t) {
  const v1 = 'bar\\'
  const v2 = '\\bar\\baz\\'
  const v3 = '\\'
  checkFilters(t, [
    { str: '(foo=bar\\5c)', type: 'EqualityFilter', val: v1, output: '(foo=bar\\5c)' },
    { str: '(foo<=bar\\5c)', type: 'le', val: v1, output: '(foo<=bar\\5c)' },
    { str: '(foo>=bar\\5c)', type: 'ge', val: v1, output: '(foo>=bar\\5c)' },
    {
      str: '(foo=\\5cbar\\5cbaz\\5c)',
      type: 'EqualityFilter',
      val: v2,
      output: '(foo=\\5cbar\\5cbaz\\5c)'
    },
    {
      str: '(foo>=\\5cbar\\5cbaz\\5c)',
      type: 'ge',
      val: v2,
      output: '(foo>=\\5cbar\\5cbaz\\5c)'
    },
    {
      str: '(foo<=\\5cbar\\5cbaz\\5c)',
      type: 'le',
      val: v2,
      output: '(foo<=\\5cbar\\5cbaz\\5c)'
    },
    { str: '(foo=\\5c)', type: 'EqualityFilter', val: v3, output: '(foo=\\5c)' },
    { str: '(foo<=\\5c)', type: 'le', val: v3, output: '(foo<=\\5c)' },
    { str: '(foo>=\\5c)', type: 'ge', val: v3, output: '(foo>=\\5c)' }
  ])
})

tap.test('\\0 in filter', function (t) {
  const str = '(foo=bar\\00)'
  const f = parse(str)
  t.ok(f)
  t.equal(f.attribute, 'foo')
  t.equal(f.value, 'bar\0')
  t.equal(f.toString(), '(foo=bar\\00)')
  t.end()
})

tap.test('literal * in filters', function (t) {
  const v1 = 'bar*'
  const v2 = '*bar*baz*'
  const v3 = '*'
  checkFilters(t, [
    { str: '(foo=bar\\2a)', type: 'EqualityFilter', val: v1, output: '(foo=bar\\2a)' },
    { str: '(foo<=bar\\2a)', type: 'le', val: v1, output: '(foo<=bar\\2a)' },
    { str: '(foo>=bar\\2a)', type: 'ge', val: v1, output: '(foo>=bar\\2a)' },
    {
      str: '(foo=\\2abar\\2abaz\\2a)',
      type: 'EqualityFilter',
      val: v2,
      output: '(foo=\\2abar\\2abaz\\2a)'
    },
    {
      str: '(foo>=\\2abar\\2abaz\\2a)',
      type: 'ge',
      val: v2,
      output: '(foo>=\\2abar\\2abaz\\2a)'
    },
    {
      str: '(foo<=\\2abar\\2abaz\\2a)',
      type: 'le',
      val: v2,
      output: '(foo<=\\2abar\\2abaz\\2a)'
    },
    { str: '(foo=\\2a)', type: 'EqualityFilter', val: v3, output: '(foo=\\2a)' },
    { str: '(foo<=\\2a)', type: 'le', val: v3, output: '(foo<=\\2a)' },
    { str: '(foo>=\\2a)', type: 'ge', val: v3, output: '(foo>=\\2a)' }
  ])
})

tap.test('* substr filter (prefix)', function (t) {
  const str = '(foo=bar*)'
  const f = parse(str)
  t.ok(f)
  t.equal(f.type, 'substring')
  t.equal(f.attribute, 'foo')
  t.equal(f.initial, 'bar')
  t.equal(f.any.length, 0)
  t.equal(f.final, '')
  t.equal(f.toString(), '(foo=bar*)')
  t.end()
})

tap.test('* substr filter (suffix)', function (t) {
  const str = '(foo=*bar)'
  const f = parse(str)
  t.ok(f)
  t.equal(f.type, 'substring')
  t.equal(f.attribute, 'foo')
  t.equal(f.initial, '')
  t.equal(f.any.length, 0)
  t.equal(f.final, 'bar')
  t.equal(f.toString(), '(foo=*bar)')
  t.end()
})

tap.test('escaped * in substr filter (prefix)', function (t) {
  const str = '(foo=bar\\2a*)'
  const f = parse(str)
  t.ok(f)
  t.equal(f.type, 'substring')
  t.equal(f.attribute, 'foo')
  t.equal(f.initial, 'bar*')
  t.equal(f.any.length, 0)
  t.equal(f.final, '')
  t.equal(f.toString(), '(foo=bar\\2a*)')
  t.end()
})

tap.test('escaped * in substr filter (suffix)', function (t) {
  const str = '(foo=*bar\\2a)'
  const f = parse(str)
  t.ok(f)
  t.equal(f.type, 'substring')
  t.equal(f.attribute, 'foo')
  t.equal(f.initial, '')
  t.equal(f.any.length, 0)
  t.equal(f.final, 'bar*')
  t.equal(f.toString(), '(foo=*bar\\2a)')
  t.end()
})

tap.test('NotFilter', function (t) {
  const str = '(&(objectClass=person)(!(objectClass=shadowAccount)))'
  const f = parse(str)
  t.ok(f)
  t.equal(f.type, 'and')
  t.equal(f.filters.length, 2)
  t.equal(f.filters[0].type, 'EqualityFilter')
  t.equal(f.filters[1].type, 'not')
  t.equal(f.filters[1].filter.type, 'EqualityFilter')
  t.equal(f.filters[1].filter.attribute, 'objectClass')
  t.equal(f.filters[1].filter.value, 'shadowAccount')
  t.end()
})

tap.test('presence filter', function (t) {
  const f = parse('(foo=*)')
  t.ok(f)
  t.equal(f.type, 'PresenceFilter')
  t.equal(f.attribute, 'foo')
  t.equal(f.toString(), '(foo=*)')
  t.end()
})

tap.test('or filter', function (t) {
  const f = parse('(|(foo=bar)(baz=bip))')
  t.ok(f)
  t.equal(f.type, 'or')
  t.equal(f.filters.length, 2)
  t.end()
})

tap.test('approx filter', function (t) {
  const f = parse('(foo~=bar)')
  t.ok(f)
  t.equal(f.type, 'ApproximateFilter')
  t.equal(f.attribute, 'foo')
  t.equal(f.value, 'bar')
  t.end()
})

tap.test('<= in filters', function (t) {
  checkFilters(t, [
    { str: '(foo=<=)', type: 'EqualityFilter', val: '<=', output: '(foo=<=)' },
    { str: '(foo<=<=)', type: 'le', val: '<=', output: '(foo<=<=)' },
    { str: '(foo>=<=)', type: 'ge', val: '<=', output: '(foo>=<=)' },
    {
      str: '(foo=bar<=baz)',
      type: 'EqualityFilter',
      val: 'bar<=baz',
      output: '(foo=bar<=baz)'
    },
    {
      str: '(foo<=bar<=baz)',
      type: 'le',
      val: 'bar<=baz',
      output: '(foo<=bar<=baz)'
    },
    {
      str: '(foo>=bar<=baz)',
      type: 'ge',
      val: 'bar<=baz',
      output: '(foo>=bar<=baz)'
    },
    {
      str: '(foo=bar<=)',
      type: 'EqualityFilter',
      val: 'bar<=',
      output: '(foo=bar<=)'
    },
    { str: '(foo<=bar<=)', type: 'le', val: 'bar<=', output: '(foo<=bar<=)' },
    { str: '(foo>=bar<=)', type: 'ge', val: 'bar<=', output: '(foo>=bar<=)' }
  ])
})

tap.test('>= in filters', function (t) {
  checkFilters(t, [
    { str: '(foo=>=)', type: 'EqualityFilter', val: '>=', output: '(foo=>=)' },
    { str: '(foo<=>=)', type: 'le', val: '>=', output: '(foo<=>=)' },
    { str: '(foo>=>=)', type: 'ge', val: '>=', output: '(foo>=>=)' },
    {
      str: '(foo=bar>=baz)',
      type: 'EqualityFilter',
      val: 'bar>=baz',
      output: '(foo=bar>=baz)'
    },
    {
      str: '(foo<=bar>=baz)',
      type: 'le',
      val: 'bar>=baz',
      output: '(foo<=bar>=baz)'
    },
    {
      str: '(foo>=bar>=baz)',
      type: 'ge',
      val: 'bar>=baz',
      output: '(foo>=bar>=baz)'
    },
    { str: '(foo=bar>=)', type: 'EqualityFilter', val: 'bar>=', output: '(foo=bar>=)' },
    { str: '(foo<=bar>=)', type: 'le', val: 'bar>=', output: '(foo<=bar>=)' },
    { str: '(foo>=bar>=)', type: 'ge', val: 'bar>=', output: '(foo>=bar>=)' }
  ])
})

tap.test('& in filters', function (t) {
  checkFilters(t, [
    { str: '(foo=&)', type: 'EqualityFilter', val: '&', output: '(foo=&)' },
    { str: '(foo<=&)', type: 'le', val: '&', output: '(foo<=&)' },
    { str: '(foo>=&)', type: 'ge', val: '&', output: '(foo>=&)' },
    {
      str: '(foo=bar&baz)',
      type: 'EqualityFilter',
      val: 'bar&baz',
      output: '(foo=bar&baz)'
    },
    {
      str: '(foo<=bar&baz)',
      type: 'le',
      val: 'bar&baz',
      output: '(foo<=bar&baz)'
    },
    {
      str: '(foo>=bar&baz)',
      type: 'ge',
      val: 'bar&baz',
      output: '(foo>=bar&baz)'
    },
    { str: '(foo=bar&)', type: 'EqualityFilter', val: 'bar&', output: '(foo=bar&)' },
    { str: '(foo<=bar&)', type: 'le', val: 'bar&', output: '(foo<=bar&)' },
    { str: '(foo>=bar&)', type: 'ge', val: 'bar&', output: '(foo>=bar&)' }
  ])
})

tap.test('| in filters', function (t) {
  checkFilters(t, [
    { str: '(foo=|)', type: 'EqualityFilter', val: '|', output: '(foo=|)' },
    { str: '(foo<=|)', type: 'le', val: '|', output: '(foo<=|)' },
    { str: '(foo>=|)', type: 'ge', val: '|', output: '(foo>=|)' },
    {
      str: '(foo=bar|baz)',
      type: 'EqualityFilter',
      val: 'bar|baz',
      output: '(foo=bar|baz)'
    },
    {
      str: '(foo<=bar|baz)',
      type: 'le',
      val: 'bar|baz',
      output: '(foo<=bar|baz)'
    },
    {
      str: '(foo>=bar|baz)',
      type: 'ge',
      val: 'bar|baz',
      output: '(foo>=bar|baz)'
    },
    { str: '(foo=bar|)', type: 'EqualityFilter', val: 'bar|', output: '(foo=bar|)' },
    { str: '(foo<=bar|)', type: 'le', val: 'bar|', output: '(foo<=bar|)' },
    { str: '(foo>=bar|)', type: 'ge', val: 'bar|', output: '(foo>=bar|)' }
  ])
})

tap.test('! in filters', function (t) {
  checkFilters(t, [
    { str: '(foo=!)', type: 'EqualityFilter', val: '!', output: '(foo=!)' },
    { str: '(foo<=!)', type: 'le', val: '!', output: '(foo<=!)' },
    { str: '(foo>=!)', type: 'ge', val: '!', output: '(foo>=!)' },
    {
      str: '(foo=bar!baz)',
      type: 'EqualityFilter',
      val: 'bar!baz',
      output: '(foo=bar!baz)'
    },
    {
      str: '(foo<=bar!baz)',
      type: 'le',
      val: 'bar!baz',
      output: '(foo<=bar!baz)'
    },
    {
      str: '(foo>=bar!baz)',
      type: 'ge',
      val: 'bar!baz',
      output: '(foo>=bar!baz)'
    },
    { str: '(foo=bar!)', type: 'EqualityFilter', val: 'bar!', output: '(foo=bar!)' },
    { str: '(foo<=bar!)', type: 'le', val: 'bar!', output: '(foo<=bar!)' },
    { str: '(foo>=bar!)', type: 'ge', val: 'bar!', output: '(foo>=bar!)' }
  ])
})

tap.test('ge filter', function (t) {
  const f = parse('(foo>=5)')
  t.ok(f)
  t.equal(f.type, 'ge')
  t.equal(f.attribute, 'foo')
  t.equal(f.value, '5')
  t.end()
})

tap.test('le filter', function (t) {
  const f = parse('(foo<=5)')
  t.ok(f)
  t.equal(f.type, 'le')
  t.equal(f.attribute, 'foo')
  t.equal(f.value, '5')
  t.end()
})

tap.test('unicode in filter', function (t) {
  checkFilters(t, [
    {
      str: '(foo=☕⛵ᄨ)',
      type: 'EqualityFilter',
      val: '☕⛵ᄨ',
      output: '(foo=\\e2\\98\\95\\e2\\9b\\b5\\e1\\84\\a8)'
    },
    {
      str: '(foo<=☕⛵ᄨ)',
      type: 'le',
      val: '☕⛵ᄨ',
      output: '(foo<=\\e2\\98\\95\\e2\\9b\\b5\\e1\\84\\a8)'
    },
    {
      str: '(foo>=☕⛵ᄨ)',
      type: 'ge',
      val: '☕⛵ᄨ',
      output: '(foo>=\\e2\\98\\95\\e2\\9b\\b5\\e1\\84\\a8)'
    },
    {
      str: '(foo=ᎢᏣᎵᏍᎠᏁᏗ)',
      type: 'EqualityFilter',
      val: 'ᎢᏣᎵᏍᎠᏁᏗ',
      output: '(foo=\\e1\\8e\\a2\\e1\\8f\\a3\\e1\\8e\\b5\\e1\\8f\\8d\\e1\\8e\\a0\\e1\\8f\\81\\e1\\8f\\97)'
    },
    {
      str: '(foo<=ᎢᏣᎵᏍᎠᏁᏗ)',
      type: 'le',
      val: 'ᎢᏣᎵᏍᎠᏁᏗ',
      output: '(foo<=\\e1\\8e\\a2\\e1\\8f\\a3\\e1\\8e\\b5\\e1\\8f\\8d\\e1\\8e\\a0\\e1\\8f\\81\\e1\\8f\\97)'
    },
    {
      str: '(foo>=ᎢᏣᎵᏍᎠᏁᏗ)',
      type: 'ge',
      val: 'ᎢᏣᎵᏍᎠᏁᏗ',
      output: '(foo>=\\e1\\8e\\a2\\e1\\8f\\a3\\e1\\8e\\b5\\e1\\8f\\8d\\e1\\8e\\a0\\e1\\8f\\81\\e1\\8f\\97)'
    }
  ])
})

tap.test('bogus filters', function (t) {
  t.throws(function () {
    parse('foo>1')
  }, 'junk')

  t.throws(function () {
    parse('(&(valid=notquite)())')
  }, 'empty parens')

  t.throws(function () {
    parse('(&(valid=notquite)wut)')
  }, 'cruft inside AndFilter')

  t.throws(function () {
    parse('(bad=asd(fdsa)')
  }, 'unescaped paren')

  t.throws(function () {
    parse('bad=\\gg')
  }, 'bad hex escape')

  t.throws(function () {
    parse('foo!=1')
  }, 'fake operator')

  t.end()
})

tap.test('mismatched parens', function (t) {
  t.throws(function () {
    parse('(&(foo=bar)(!(state=done))')
  })

  t.throws(function () {
    parse('(foo=1')
  }, 'missing last paren')

  t.throws(function () {
    parse('(foo=1\\29')
  }, 'missing last paren')

  t.throws(function () {
    parse('foo=1)')
  }, 'trailing paren')

  t.throws(function () {
    parse('foo=1))')
  }, 'trailing paren')

  t.throws(function () {
    parse('foo=1)a)')
  }, 'trailing paren')

  t.throws(function () {
    parse('(foo=1)trailing')
  }, 'trailing text')

  t.throws(function () {
    parse('leading(foo=1)')
  }, 'leading text')

  t.end()
})

tap.test('garbage in subfilter not allowed', function (t) {
  t.throws(function () {
    parse('(&(foo=bar)|(baz=quux)(hello=world))')
  }, '| subfilter without parens not allowed')

  t.throws(function () {
    parse('(&(foo=bar)!(baz=quux)(hello=world))')
  }, '! subfilter without parens not allowed')

  t.throws(function () {
    parse('(&(foo=bar)&(baz=quux)(hello=world))')
  }, '& subfilter without parens not allowed')

  t.throws(function () {
    parse('(&(foo=bar)g(baz=quux)(hello=world))')
  })

  t.throws(function () {
    parse('(&(foo=bar)=(baz=quux)(hello=world))')
  })

  t.throws(function () {
    parse('(&foo=bar)')
  })

  t.throws(function () {
    parse('(|foo=bar)')
  })

  t.throws(function () {
    parse('(!foo=bar)')
  })

  t.throws(function () {
    parse('(!(foo=bar)a')
  })

  t.end()
})

tap.test('nested parens', function (t) {
  t.throws(function () {
    parse('((foo=bar))')
  })
  t.end()
})

tap.test('tolerate underscores in names', function (t) {
  let f = parse('(foo_bar=val)')
  t.ok(f)
  t.equal(f.attribute, 'foo_bar')
  f = parse('(_leading=val)')
  t.ok(f)
  t.equal(f.attribute, '_leading')
  t.end()
})

tap.test('ExtensibleFilter', t => {
  t.test('parse RFC example 1', async t => {
    const f = parse('(cn:caseExactMatch:=Fred Flintstone)')
    t.ok(f)
    t.equal(f.type, 'ExtensibleFilter')
    t.equal(f.matchType, 'cn')
    t.equal(f.matchingRule, 'caseExactMatch')
    t.equal(f.matchValue, 'Fred Flintstone')
    t.notOk(f.dnAttributes)
  })

  t.test('parse RFC example 2', async t => {
    const f = parse('(cn:=Betty Rubble)')
    t.ok(f)
    t.equal(f.matchType, 'cn')
    t.equal(f.matchValue, 'Betty Rubble')
    t.notOk(f.dnAttributes)
    t.notOk(f.matchingRule)
  })

  t.test('parse RFC example 3', async t => {
    const f = parse('(sn:dn:2.4.6.8.10:=Barney Rubble)')
    t.ok(f)
    t.equal(f.matchType, 'sn')
    t.equal(f.matchingRule, '2.4.6.8.10')
    t.equal(f.matchValue, 'Barney Rubble')
    t.equal(f.dnAttributes, true)
  })

  t.test('parse RFC example 3', async t => {
    const f = parse('(o:dn:=Ace Industry)')
    t.ok(f)
    t.equal(f.matchType, 'o')
    t.notOk(f.matchingRule)
    t.equal(f.matchValue, 'Ace Industry')
    t.ok(f.dnAttributes)
  })

  t.test('parse RFC example 4', async t => {
    const f = parse('(:1.2.3:=Wilma Flintstone)')
    t.ok(f)
    t.notOk(f.matchType)
    t.equal(f.matchingRule, '1.2.3')
    t.equal(f.matchValue, 'Wilma Flintstone')
    t.notOk(f.dnAttributes)
  })

  t.test('parse RFC example 5', async t => {
    const f = parse('(:DN:2.4.6.8.10:=Dino)')
    t.ok(f)
    t.notOk(f.matchType)
    t.equal(f.matchingRule, '2.4.6.8.10')
    t.equal(f.matchValue, 'Dino')
    t.ok(f.dnAttributes)
  })

  t.test('missing :=', async t => {
    t.throws(function () {
      parse('(:dn:oops)')
    })
  })

  t.test('substring-style handling', async t => {
    const f = parse('(foo:1.2.3.4:=a*\\2ab*c)')
    t.ok(f)
    t.equal(f.value, 'a**b*c')
    t.equal(f.initial, 'a')
    t.same(f.any, ['*b'])
    t.equal(f.final, 'c')
  })

  t.test('matches throws', async t => {
    const f = new ExtensibleFilter()
    t.throws(
      () => f.matches({}),
      Error('not implemented')
    )
  })

  t.end()
})
