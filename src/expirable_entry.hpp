
#pragma once

#include "entry.hpp"

namespace quasardb
{

template <typename Derivate>
class ExpirableEntry : public Entry<Derivate>
{
public:
    ExpirableEntry(cluster_data_ptr cd, const char * alias) : Entry<Derivate>(cd, alias)
    {
    }
    virtual ~ExpirableEntry(void)
    {
    }

public:
    template <typename F>
    static void Init(v8::Handle<v8::Object> exports, const char * className, F init)
    {
        Entry<Derivate>::Init(exports, className, [init](v8::Local<v8::FunctionTemplate> tpl) {
            // call init function of derivate
            init(tpl);

            // add our expiry functions then hand over to entry
            NODE_SET_PROTOTYPE_METHOD(tpl, "expiresAt", ExpirableEntry<Derivate>::expiresAt);
            NODE_SET_PROTOTYPE_METHOD(tpl, "expiresFromNow", ExpirableEntry<Derivate>::expiresFromNow);
            NODE_SET_PROTOTYPE_METHOD(tpl, "getExpiry", ExpirableEntry<Derivate>::getExpiry);
        });
    }

public:
    static void expiresAt(const v8::FunctionCallbackInfo<v8::Value> & args)
    {
        Entry<Derivate>::queue_work(args,
                                    [](qdb_request * qdb_req) {
                                        qdb_req->output.error = qdb_expires_at(
                                            qdb_req->handle(), qdb_req->input.alias.c_str(), qdb_req->input.expiry);
                                    },
                                    Entry<Derivate>::processVoidResult, &ArgsEaterBinder::expiry);
    }

    static void expiresFromNow(const v8::FunctionCallbackInfo<v8::Value> & args)
    {
        Entry<Derivate>::queue_work(args,
                                    [](qdb_request * qdb_req) {
                                        qdb_req->output.error =
                                            qdb_expires_from_now(qdb_req->handle(), qdb_req->input.alias.c_str(),
                                                                 static_cast<qdb_int_t>(qdb_req->input.content.value));
                                    },
                                    Entry<Derivate>::processVoidResult, &ArgsEaterBinder::integer);
    }

    static void getExpiry(const v8::FunctionCallbackInfo<v8::Value> & args)
    {
        Entry<Derivate>::queue_work(args,
                                    [](qdb_request * qdb_req) {
                                        qdb_entry_metadata_t meta;
                                        qdb_req->output.error =
                                            qdb_get_metadata(qdb_req->handle(), qdb_req->input.alias.c_str(), &meta);
                                        qdb_req->output.content.date = static_cast<qdb_time_t>(meta.expiry_time.tv_sec) * 1000 +
                                            static_cast<qdb_time_t>(meta.expiry_time.tv_nsec / 1000000ull);
                                    },
                                    Entry<Derivate>::processDateResult, &ArgsEaterBinder::integer);
    }
};
};
