export const ROLES = {
    admin: {
      description: "Acceso total al sistema",
      permissions: {
        users: {
          view: 1,
          create: 1,
          edit: 1,
          delete: 1
        },
        projects: {
          view: 1,
          create: 1,
          edit: 1,
          delete: 1
        },
        quotations: {
          view: 1,
          create: 1,
          edit: 1,
          delete: 1
        },
        reports: {
          view: 1,
          export: 1
        },
        inventory: {
            view: 1,
            create: 1,
            edit: 1,
            delete: 1,
        }
      }
    },
    sales_manager: {
      description: "Gestión de equipo de ventas y reportes",
      permissions: {
        users: { view: 1 },
        projects: {
          view: 1,
          edit: 0
        },
        quotations: {
          view: 1,
          create: 1,
          edit: 1
        },
        reports: {
          view: 1,
          export: 1
        }
      }
    },
    operations: {
      description: "Gestión de operaciones y actualización de propiedades",
      permissions: {
        projects: {
          view: 1,
          edit: 1
        },
        quotations: { view: 1 },
        reports: {
          view: 1,
          export: 1
        },
        inventory: {
          view: 1,
          edit: 1,
          status: 1
        }
      }
    },
    sales_agent: {
      description: "Vendedor",
      permissions: {
        projects: { view: 1 },
        quotations: {
          view: 1,
          create: 1
        },
        reports: { view: 1 }
      }
    }
  };