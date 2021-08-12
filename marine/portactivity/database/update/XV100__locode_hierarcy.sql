create table if not exists hierarchy_port_locode (
    locode_portnet          text not null,
    locode_pilotweb         text,

    constraint pk_hierarchy_port_locode primary key (locode_portnet, locode_pilotweb)
);

create table if not exists hierarchy_portarea (
    locode_portnet          text not null,
    portareacode_portnet    text not null,
    imo_portfacilitynumber  text not null,

    constraint pk_hierarchy_portarea primary key (locode_portnet, portareacode_portnet, imo_portfacilitynumber);
);